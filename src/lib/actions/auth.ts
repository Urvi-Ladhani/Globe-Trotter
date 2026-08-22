"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=Email and password are required");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "");
  const lastName = String(formData.get("last_name") || "");
  const phone = emptyToNull(formData.get("phone"));
  const homeCity = emptyToNull(formData.get("home_city"));
  const homeCountry = emptyToNull(formData.get("home_country"));
  const bio = emptyToNull(formData.get("bio"));

  if (!email || !password || !firstName) {
    redirect("/register?error=Email, password and first name are required");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        home_city: homeCity,
        home_country: homeCountry,
        bio,
      },
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // Write phone_number into profile_private separately (private column).
  if (data.user && phone) {
    await supabase
      .from("profile_private")
      .upsert({ user_id: data.user.id, phone_number: phone });
  }

  redirect("/login?success=Check your email to confirm your account");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}