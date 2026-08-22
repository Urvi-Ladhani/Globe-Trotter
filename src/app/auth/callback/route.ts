import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch current profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, home_country, home_city")
          .eq("id", user.id)
          .maybeSingle();

        // Fetch private profile
        const { data: privateProfile } = await supabase
          .from("profile_private")
          .select("phone_number")
          .eq("user_id", user.id)
          .maybeSingle();

        // Check if additional info is needed
        const isIncomplete =
          !profile ||
          !profile.first_name ||
          !profile.home_country ||
          !profile.home_city ||
          !privateProfile?.phone_number;

        if (isIncomplete) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`);
}
