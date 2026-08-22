import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; invoiceId: string }>;
};

async function requireAdmin() {
  const authClient = await createServerSupabase();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: adminRow } = await authClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = Boolean(adminRow) || isAdminEmail(user.email);
  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Only Vitespace admin can manage invoices." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * PATCH /api/clients/[id]/invoices/[invoiceId]
 * Admin-only metadata update (service role — same trust model as upload).
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate && gate.error) return gate.error;

    const { id: clientId, invoiceId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    const row: Record<string, unknown> = {};
    if (body.number !== undefined) row.number = String(body.number).trim();
    if (body.title !== undefined) row.title = String(body.title).trim();
    if (body.amount !== undefined) row.amount = Number(body.amount) || 0;
    if (body.issuedAt !== undefined) {
      const issued = String(body.issuedAt).trim();
      if (issued) row.issued_at = issued;
    }
    if (body.dueAt !== undefined) {
      const due = String(body.dueAt).trim();
      row.due_at = due || null;
    }
    if (body.status !== undefined) row.status = String(body.status).trim();
    if (body.clearFile === true) {
      row.file_url = null;
      row.file_name = null;
      row.file_size = null;
      row.uploaded_at = null;
    } else {
      if (body.fileUrl !== undefined) {
        row.file_url =
          body.fileUrl === null || body.fileUrl === ""
            ? null
            : body.fileUrl;
      }
      if (body.fileName !== undefined) {
        row.file_name =
          body.fileName === null || body.fileName === ""
            ? null
            : body.fileName;
      }
      if (body.fileSize !== undefined) {
        row.file_size =
          body.fileSize === null || body.fileSize === ""
            ? null
            : body.fileSize;
      }
    }

    if (Object.keys(row).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("invoices")
      .update(row)
      .eq("id", invoiceId)
      .eq("client_id", clientId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (!data) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
        local: {
          id: data.id,
          clientId: data.client_id,
          number: data.number,
          title: data.title,
          amount: data.amount,
          issuedAt: data.issued_at,
          dueAt: data.due_at ?? "",
          status: data.status,
          fileUrl: data.file_url,
          fileName: data.file_name,
          fileSize: data.file_size,
        },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]/invoices/[invoiceId]
 * Admin-only delete (service role).
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate && gate.error) return gate.error;

    const { id: clientId, invoiceId } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
      .eq("client_id", clientId)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (!data) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    // Drop linked invoice notification if present (trigger id pattern)
    await supabase.from("notifications").delete().eq("id", `n_inv_${invoiceId}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
