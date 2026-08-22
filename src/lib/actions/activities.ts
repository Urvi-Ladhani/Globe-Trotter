"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, emptyToNull, numOrNull } from "@/lib/auth";

export async function submitActivity(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const cityId = String(formData.get("city_id") || "").trim();
  const category = String(formData.get("category") || "Other").trim();
  const description = emptyToNull(formData.get("description"));
  const costEstimateInr = numOrNull(formData.get("cost_estimate_inr"));
  const durationMinutes = numOrNull(formData.get("duration_minutes"));
  const imageUrl = emptyToNull(formData.get("image_url"));

  if (!name || !cityId) {
    redirect("/activities?error=Name and city are required");
  }

  const { error } = await supabase.from("activities").insert({
    name,
    city_id: cityId,
    category,
    description,
    cost_estimate_inr: costEstimateInr,
    duration_minutes: durationMinutes,
    image_url: imageUrl,
    is_approved: false, // Requires admin approval
    created_by_user_id: user.id,
  });

  if (error) {
    redirect(`/activities?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/activities");
  redirect("/activities?success=Activity submitted for review! It will appear once approved by an admin.");
}

export async function addActivityToTripStop(formData: FormData) {
  const { supabase } = await requireUser();
  const stopId = String(formData.get("stop_id") || "").trim();
  const activityId = emptyToNull(formData.get("activity_id"));
  const customName = emptyToNull(formData.get("custom_name"));
  const dayNumber = Number(formData.get("day_number") || 1);
  const plannedCostInr = numOrNull(formData.get("planned_cost_inr"));
  const scheduledTime = emptyToNull(formData.get("scheduled_time"));
  const notes = emptyToNull(formData.get("notes"));
  const returnUrl = String(formData.get("return_url") || "/activities");

  if (!stopId) {
    redirect(`${returnUrl}?error=Please select a trip stop`);
  }

  const { error } = await supabase.from("trip_activities").insert({
    stop_id: stopId,
    activity_id: activityId,
    custom_name: customName,
    day_number: dayNumber,
    planned_cost_inr: plannedCostInr,
    scheduled_time: scheduledTime,
    notes: notes,
  });

  if (error) {
    redirect(`${returnUrl}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trips");
  redirect(`${returnUrl}?success=Activity added to your trip stop!`);
}
