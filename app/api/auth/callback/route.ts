import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin";

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/admin/login?error=auth_failed", request.url)
    );
  }

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/admin/login?error=no_user", request.url)
    );
  }

  // Check if this is a password reset flow (next points to reset-password)
  if (next.includes("reset-password")) {
    return response;
  }

  // For OAuth logins: check/create admin_users record
  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );

  const { data: adminUser } = await serviceSupabase
    .from("admin_users")
    .select("is_approved")
    .eq("auth_id", user.id)
    .single();

  if (!adminUser) {
    // New OAuth user — create admin_users record as pending
    await serviceSupabase.from("admin_users").insert({
      auth_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Unknown",
      is_approved: false,
      is_super_admin: false,
    });

    // Sign them out and redirect with pending message
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?message=pending_approval", request.url)
    );
  }

  if (!adminUser.is_approved) {
    // Existing but not approved — sign out
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?message=pending_approval", request.url)
    );
  }

  // Approved user — redirect to admin
  return response;
}
