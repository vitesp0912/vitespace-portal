import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveUserAccess } from "@/lib/supabase/data";

/**
 * Server-side gate for billing. RLS also blocks invoice rows for members;
 * this prevents rendering the invoices route at all.
 */
export async function requireInvoiceAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const access = await resolveUserAccess(supabase, user.id);
  const email = user.email ?? "";
  const isAdmin = access.isAdmin || isAdminEmail(email);

  if (isAdmin || access.role === "owner") {
    return { user, access };
  }

  redirect("/");
}
