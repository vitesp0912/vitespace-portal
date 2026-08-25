import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import {
  dispatchPortalAlert,
  type PortalAlertAudience,
  type PortalAlertKind,
} from "@/lib/email/dispatch";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const KINDS = new Set<PortalAlertKind>([
  "invoice",
  "document",
  "message",
  "progress",
  "update",
]);

const AUDIENCES = new Set<PortalAlertAudience>(["owners", "vitespace"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/clients/[id]/alerts/email
 * Auth required. Members/admins of this client may trigger alerts.
 * Body: { audience, kind, title, detail, path }
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;
    const auth = await createServerSupabase();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await auth
      .from("client_users")
      .select("client_id")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle();

    const { data: adminRow } = await auth
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = Boolean(adminRow) || isAdminEmail(user.email);
    if (!membership && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const audience = String(body.audience || "") as PortalAlertAudience;
    const kind = String(body.kind || "") as PortalAlertKind;
    const title = String(body.title || "").trim();
    const detail = String(body.detail || "").trim();
    const path = String(body.path || "/").trim() || "/";

    if (!AUDIENCES.has(audience) || !KINDS.has(kind) || !title || !detail) {
      return NextResponse.json(
        { error: "audience, kind, title, and detail are required." },
        { status: 400 }
      );
    }

    // Clients may only notify Vitespace; admins may notify owners.
    if (!isAdmin && audience !== "vitespace") {
      return NextResponse.json(
        { error: "Clients can only send alerts to Vitespace." },
        { status: 403 }
      );
    }

    const result = await dispatchPortalAlert({
      clientId,
      audience,
      kind,
      title: title.slice(0, 120),
      detail: detail.slice(0, 280),
      path: path.startsWith("/") ? path.slice(0, 200) : `/${path.slice(0, 199)}`,
    });

    if (!result.ok && !result.skipped) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      sent: result.ok ? result.sent : 0,
      skipped: !result.ok && result.skipped ? true : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Alert failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
