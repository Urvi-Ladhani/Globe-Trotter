import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

const publicExact = new Set(["/login", "/register", "/forgot-password"]);

function isPublicPath(pathname: string) {
  if (publicExact.has(pathname)) return true;
  if (pathname.startsWith("/trips/share/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Unauthenticated users cannot access protected routes
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated users: enforce profile completion
  if (user) {
    // Check if profile details are missing
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, home_country, home_city")
      .eq("id", user.id)
      .maybeSingle();

    const { data: privateProfile } = await supabase
      .from("profile_private")
      .select("phone_number")
      .eq("user_id", user.id)
      .maybeSingle();

    const isIncomplete =
      !profile ||
      !profile.first_name ||
      !profile.home_country ||
      !profile.home_city ||
      !privateProfile?.phone_number;

    if (isIncomplete) {
      if (pathname !== "/onboarding" && !pathname.startsWith("/auth/")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    } else {
      // If profile is already complete, prevent visiting login/register/onboarding
      if (pathname === "/login" || pathname === "/register" || pathname === "/onboarding") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
