import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteFromR2ByPublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

async function requireUser() {
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
  return { user, isAdmin, authClient };
}

async function requireAdmin() {
  const gate = await requireUser();
  if ("error" in gate && gate.error) return gate;
  if (!gate.isAdmin) {
    return {
      error: NextResponse.json(
        { error: "Only Vitespace admin can manage documents." },
        { status: 403 }
      ),
    };
  }
  return gate;
}

/**
 * PATCH /api/clients/[id]/documents/[documentId]
 * Admin-only metadata update (service role).
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate && gate.error) return gate.error;

    const { id: clientId, documentId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    const row: Record<string, unknown> = {};
    if (body.name !== undefined) row.name = String(body.name).trim();
    if (body.description !== undefined) {
      const desc = String(body.description).trim();
      row.description = desc || null;
      row.edited_at = new Date().toISOString();
    }
    if (body.category !== undefined) row.category = String(body.category).trim();
    if (body.fileUrl !== undefined && body.fileUrl !== null && body.fileUrl !== "") {
      row.file_url = body.fileUrl;
    }
    if (body.size !== undefined && body.size !== null && body.size !== "") {
      row.file_size = body.size;
    }
    if (
      body.mimeType !== undefined &&
      body.mimeType !== null &&
      body.mimeType !== ""
    ) {
      row.mime_type = body.mimeType;
    }

    if (Object.keys(row).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("documents")
      .update(row)
      .eq("id", documentId)
      .eq("client_id", clientId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (!data) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      local: {
        id: data.id,
        clientId: data.client_id,
        name: data.name,
        description: data.description ?? undefined,
        category: data.category || "project_documents",
        uploadedAt: String(data.uploaded_at ?? "").split("T")[0],
        size: data.file_size ?? "",
        fileUrl: data.file_url ?? undefined,
        mimeType: data.mime_type ?? undefined,
        uploadedBy: data.uploaded_by,
        uploadedByUserId: data.uploaded_by_user_id ?? undefined,
        uploadedByEmail: data.uploaded_by_email ?? undefined,
        editedAt: data.edited_at ?? undefined,
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
 * DELETE /api/clients/[id]/documents/[documentId]
 * Admin can delete any; portal users can delete only their own uploads.
 * Also removes the R2 object.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const gate = await requireUser();
    if ("error" in gate && gate.error) return gate.error;

    const { id: clientId, documentId } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabase
      .from("documents")
      .select("id, file_url, uploaded_by_user_id, client_id")
      .eq("id", documentId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 502 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (!gate.isAdmin) {
      const uploaderId = existing.uploaded_by_user_id
        ? String(existing.uploaded_by_user_id)
        : null;
      if (!uploaderId || uploaderId !== gate.user.id) {
        return NextResponse.json(
          { error: "You can only delete documents you uploaded." },
          { status: 403 }
        );
      }

      const { data: membership } = await gate.authClient
        .from("client_users")
        .select("client_id")
        .eq("user_id", gate.user.id)
        .eq("client_id", clientId)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }

    const fileUrl = existing.file_url ? String(existing.file_url) : null;

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("client_id", clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    await supabase.from("notifications").delete().eq("id", `n_doc_${documentId}`);

    if (fileUrl) {
      try {
        await deleteFromR2ByPublicUrl(fileUrl);
      } catch (r2Err) {
        console.error("Failed to delete document file from R2:", r2Err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
