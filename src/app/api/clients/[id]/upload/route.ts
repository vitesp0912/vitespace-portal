import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  formatFileSize,
  safeFileName,
  uploadToR2,
  type R2FolderKind,
} from "@/lib/r2";

export const runtime = "nodejs";

const KINDS = new Set<R2FolderKind>(["invoices", "documents"]);
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/clients/[id]/upload
 * Auth required. User must belong to this client (client_users).
 * FormData:
 *   kind: "invoices" | "documents"
 *   file: File
 *   company?: string
 *   uploadedBy?: "client" | "vitespace"
 *   // invoices: number, title, amount, issuedAt, dueAt, status
 *   // documents: category, name?
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;

    const authClient = await createServerSupabase();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await authClient
      .from("client_users")
      .select("client_id")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    const { data: adminRow } = await authClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = Boolean(adminRow) || isAdminEmail(user.email);

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have access to this client." },
        { status: 403 }
      );
    }

    const form = await request.formData();

    const kindRaw = String(form.get("kind") || "");
    if (!KINDS.has(kindRaw as R2FolderKind)) {
      return NextResponse.json(
        { error: 'kind must be "invoices" or "documents"' },
        { status: 400 }
      );
    }
    const kind = kindRaw as R2FolderKind;

    // Invoices are Vitespace admin only — clients view/download only
    if (kind === "invoices" && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Invoice uploads are not available from the client portal. Vitespace will upload invoices for you.",
        },
        { status: 403 }
      );
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (kind === "documents" && file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        { error: "File must be 15 MB or smaller." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: clientRow, error: clientError } = await supabase
      .from("clients")
      .select("id, company")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      return NextResponse.json(
        { error: `Supabase clients lookup failed: ${clientError.message}` },
        { status: 500 }
      );
    }

    const companyFallback = String(form.get("company") || "").trim();
    const company = clientRow?.company?.trim() || companyFallback;
    if (!company) {
      return NextResponse.json(
        {
          error:
            "Client company not found. Run clients SQL/seed, or pass company in the form.",
        },
        { status: 404 }
      );
    }

    const originalName = safeFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, url } = await uploadToR2({
      company,
      kind,
      fileName: originalName,
      body: buffer,
      contentType: file.type || undefined,
    });

    const fileSize = formatFileSize(file.size);
    const nowIso = new Date().toISOString();

    if (kind === "invoices") {
      const number = String(form.get("number") || "").trim();
      const title = String(form.get("title") || "").trim();
      if (!number || !title) {
        return NextResponse.json(
          { error: "number and title are required for invoices" },
          { status: 400 }
        );
      }

      const amount = Number(form.get("amount") || 0) || 0;
      const issuedAt =
        String(form.get("issuedAt") || "").trim() || nowIso.split("T")[0];
      const dueAt = String(form.get("dueAt") || "").trim() || null;
      const status = String(form.get("status") || "pending").trim() || "pending";

      const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("client_id", clientId)
        .eq("number", number)
        .maybeSingle();

      const id = existing?.id ?? `inv_${Date.now()}`;

      const row = {
        id,
        client_id: clientId,
        number,
        title,
        amount,
        status,
        issued_at: issuedAt,
        due_at: dueAt,
        file_name: originalName,
        file_url: url,
        file_size: fileSize,
        uploaded_at: nowIso,
      };

      const { data, error } = await supabase
        .from("invoices")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          {
            error: `Uploaded to R2 but failed to save invoice row: ${error.message}`,
            file: { key, url, fileName: originalName, fileSize },
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        kind,
        path: key,
        file: { key, url, fileName: originalName, fileSize },
        record: data,
        local: {
          id: data.id,
          clientId,
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
    }

    // documents — any file type, max 15 MB
    const displayName = String(form.get("name") || "").trim() || originalName;
    const description = String(form.get("description") || "").trim() || null;
    const category = String(form.get("category") || "").trim() || null;
    const uploadedByRaw = String(form.get("uploadedBy") || "client").trim();
    const uploadedBy = uploadedByRaw === "vitespace" ? "vitespace" : "client";
    const mimeType = file.type || null;
    const id = `doc_${Date.now()}`;

    const uploadedByEmail = user.email?.trim() || null;

    const row = {
      id,
      client_id: clientId,
      name: displayName,
      description,
      category,
      file_url: url,
      file_size: fileSize,
      mime_type: mimeType,
      uploaded_by: uploadedBy,
      uploaded_by_user_id: user.id,
      uploaded_by_email: uploadedByEmail,
      uploaded_at: nowIso,
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(row)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: `Uploaded to R2 but failed to save document row: ${error.message}`,
          file: { key, url, fileName: originalName, fileSize },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      kind,
      path: key,
      file: { key, url, fileName: originalName, fileSize },
      record: data,
      local: {
        id: data.id,
        clientId,
        name: data.name,
        description: data.description ?? undefined,
        category: data.category || "project_documents",
        uploadedAt: (data.uploaded_at || nowIso).split("T")[0],
        size: data.file_size || fileSize,
        fileUrl: data.file_url,
        mimeType: data.mime_type ?? undefined,
        uploadedBy: data.uploaded_by ?? uploadedBy,
        uploadedByUserId: data.uploaded_by_user_id ?? user.id,
        uploadedByEmail: data.uploaded_by_email ?? uploadedByEmail ?? undefined,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
