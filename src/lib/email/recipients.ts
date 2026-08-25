import { getSupabaseAdmin } from "@/lib/supabase/admin";

function normalizeEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

/** Client portal owners (auth emails). Falls back to clients.email. */
export async function getClientOwnerEmails(clientId: string): Promise<{
  company: string;
  emails: string[];
}> {
  const admin = getSupabaseAdmin();

  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("id, company, email")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) throw new Error(clientError.message);

  const company = client?.company?.trim() || "your project";
  const emails = new Set<string>();

  const { data: owners, error: ownersError } = await admin
    .from("client_users")
    .select("user_id")
    .eq("client_id", clientId)
    .eq("role", "owner");

  if (ownersError) throw new Error(ownersError.message);

  for (const row of owners ?? []) {
    const userId = String(row.user_id || "");
    if (!userId) continue;
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) continue;
    const email = normalizeEmail(data.user.email);
    if (email) emails.add(email);
  }

  const fallback = normalizeEmail(client?.email ? String(client.email) : null);
  if (emails.size === 0 && fallback) emails.add(fallback);

  return { company, emails: [...emails] };
}
