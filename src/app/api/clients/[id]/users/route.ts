import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const authClient = await createServerSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: adminRow } = await authClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = Boolean(adminRow) || isAdminEmail(user.email);
  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin only." }, { status: 403 }),
    };
  }

  return { ok: true };
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users ?? [];
    const match = users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === normalized
    );
    if (match) return match.id;
    if (users.length < perPage) return null;
    page += 1;
    if (page > 20) return null;
  }
}

/**
 * GET /api/clients/[id]/users — list portal users linked to this client
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id: clientId } = await context.params;
    const admin = getSupabaseAdmin();

    const { data: rows, error } = await admin
      .from("client_users")
      .select("id, user_id, client_id, role, name")
      .eq("client_id", clientId)
      .order("role", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = await Promise.all(
      (rows ?? []).map(async (row) => {
        const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
        return {
          id: row.id as string,
          userId: row.user_id as string,
          clientId: row.client_id as string,
          role: row.role as "owner" | "member",
          name: row.name ? String(row.name) : null,
          email: userData.user?.email ?? null,
        };
      })
    );

    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/clients/[id]/users
 * Body: { name, email, password?, role?: "owner" | "member" }
 * Creates Auth user if needed, then links to client_users.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id: clientId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const role = body.role === "owner" ? "owner" : "member";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: clientRow, error: clientError } = await admin
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 });
    }
    if (!clientRow) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    let userId = await findAuthUserIdByEmail(admin, email);
    let created = false;

    if (!userId) {
      if (password.length < 6) {
        return NextResponse.json(
          {
            error:
              "Password is required (min 6 characters) for a new portal user.",
          },
          { status: 400 }
        );
      }

      const { data: createdUser, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
        });

      if (createError || !createdUser.user) {
        return NextResponse.json(
          { error: createError?.message || "Failed to create auth user." },
          { status: 400 }
        );
      }

      userId = createdUser.user.id;
      created = true;
    }

    const { data: existingLink } = await admin
      .from("client_users")
      .select("id")
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json(
        { error: "This user is already linked to this client." },
        { status: 409 }
      );
    }

    const { data: link, error: linkError } = await admin
      .from("client_users")
      .insert({
        user_id: userId,
        client_id: clientId,
        role,
        name,
      })
      .select("id, user_id, client_id, role, name")
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        {
          error:
            linkError?.message ||
            "Auth user exists but failed to link to client.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      created,
      user: {
        id: link.id,
        userId: link.user_id,
        clientId: link.client_id,
        role: link.role,
        name: link.name,
        email,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]/users
 * Body: { userId } — removes client_users link and deletes the Auth user
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { id: clientId } = await context.params;
    const body = (await request.json()) as { userId?: string };
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: adminRow } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminRow) {
      return NextResponse.json(
        {
          error:
            "This account is an admin user and cannot be deleted from here.",
        },
        { status: 400 }
      );
    }

    const { error: unlinkError } = await admin
      .from("client_users")
      .delete()
      .eq("client_id", clientId)
      .eq("user_id", userId);

    if (unlinkError) {
      return NextResponse.json({ error: unlinkError.message }, { status: 500 });
    }

    // Remove any remaining client links, then delete Auth user
    const { error: leftoverError } = await admin
      .from("client_users")
      .delete()
      .eq("user_id", userId);

    if (leftoverError) {
      return NextResponse.json(
        { error: leftoverError.message },
        { status: 500 }
      );
    }

    const { error: deleteAuthError } =
      await admin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return NextResponse.json(
        {
          error: `Removed from client, but failed to delete Auth user: ${deleteAuthError.message}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, deletedAuth: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
