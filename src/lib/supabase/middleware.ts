import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isResetPassword = path === "/reset-password";
  const isPublicAuth = isLogin || isResetPassword;
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");

  // Old admin login URL → shared /login
  if (path === "/admin/login") {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  // Missing env on Vercel would otherwise crash proxy/middleware
  if (!url || !anonKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    if (!isPublicAuth) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      return NextResponse.redirect(login);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminUser = Boolean(user && isAdminEmail(user.email));

  if (!user && !isPublicAuth) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return NextResponse.redirect(login);
  }

  if (user && isLogin) {
    const dest = request.nextUrl.clone();
    dest.pathname = adminUser ? "/admin" : "/";
    return NextResponse.redirect(dest);
  }

  // Only the hardcoded admin email may access /admin
  if (user && isAdminRoute && !adminUser) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/";
    return NextResponse.redirect(dest);
  }

  return supabaseResponse;
}
