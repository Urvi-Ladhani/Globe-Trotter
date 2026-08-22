import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, emptyToNull } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const bio = emptyToNull(formData.get("bio"));
  const homeCity = emptyToNull(formData.get("home_city"));
  const homeCountry = emptyToNull(formData.get("home_country"));
  const preferredCurrency = String(formData.get("preferred_currency") || "INR").trim();
  const photoUrl = emptyToNull(formData.get("photo_url"));

  if (!firstName) {
    redirect("/profile?error=First name is required");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      bio,
      home_city: homeCity,
      home_country: homeCountry,
      preferred_currency: preferredCurrency,
      photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/profile?success=Profile updated successfully");
}

export async function updatePhoneNumber(formData: FormData) {
  const { supabase, user } = await requireUser();
  const phoneNumber = emptyToNull(formData.get("phone_number"));

  const { error } = await supabase
    .from("profile_private")
    .upsert({
      user_id: user.id,
      phone_number: phoneNumber,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  redirect("/profile?success=Phone number updated successfully");
}

export async function removeSavedDestination(formData: FormData) {
  const { supabase, user } = await requireUser();
  const savedId = String(formData.get("saved_id") || "");
  const cityId = String(formData.get("city_id") || "");

  let query = supabase.from("saved_destinations").delete().eq("user_id", user.id);
  if (savedId) {
    query = query.eq("saved_id", savedId);
  } else if (cityId) {
    query = query.eq("city_id", cityId);
  }

  await query;
  revalidatePath("/profile");
  revalidatePath("/cities");
  redirect("/profile");
}

export async function saveDestination(formData: FormData) {
  const { supabase, user } = await requireUser();
  const cityId = String(formData.get("city_id") || "");
  const returnUrl = String(formData.get("return_url") || "/cities");

  if (!cityId) redirect(returnUrl);

  await supabase.from("saved_destinations").insert({
    user_id: user.id,
    city_id: cityId,
  });

  revalidatePath("/cities");
  revalidatePath("/profile");
  redirect(returnUrl);
}
