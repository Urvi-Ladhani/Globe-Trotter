"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, emptyToNull, numOrNull } from "@/lib/auth";

export async function createTrip(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/trips/new?error=Name is required");

  const startDate = emptyToNull(formData.get("start_date"));
  const endDate = emptyToNull(formData.get("end_date"));
  const description = emptyToNull(formData.get("description"));
  const coverPhotoUrl = emptyToNull(formData.get("cover_photo_url"));
  const estimatedBudgetInr = numOrNull(formData.get("estimated_budget_inr"));

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name,
      start_date: startDate ?? undefined,
      end_date: endDate ?? undefined,
      description,
      cover_photo_url: coverPhotoUrl,
      estimated_budget_inr: estimatedBudgetInr,
      status: "upcoming",
      is_public: false,
    })
    .select("trip_id")
    .single();

  if (error) redirect(`/trips/new?error=${encodeURIComponent(error.message)}`);
  
  // If city_id was provided to add initial stop
  const initialCityId = emptyToNull(formData.get("initial_city_id"));
  if (initialCityId && data?.trip_id) {
    await supabase.from("trip_stops").insert({
      trip_id: data.trip_id,
      city_id: initialCityId,
      start_date: startDate ?? new Date().toISOString().split("T")[0],
      end_date: endDate ?? new Date().toISOString().split("T")[0],
      order_index: 0,
    });
  }

  revalidatePath("/trips");
  revalidatePath("/");
  redirect(`/trips/${data.trip_id}/build`);
}

export async function updateTrip(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect(`/trips/${tripId}?error=Name is required`);

  const { error } = await supabase
    .from("trips")
    .update({
      name,
      start_date: emptyToNull(formData.get("start_date")) ?? undefined,
      end_date: emptyToNull(formData.get("end_date")) ?? undefined,
      description: emptyToNull(formData.get("description")),
      status: String(formData.get("status") || "upcoming"),
      cover_photo_url: emptyToNull(formData.get("cover_photo_url")),
      estimated_budget_inr: numOrNull(formData.get("estimated_budget_inr")),
      updated_at: new Date().toISOString(),
    })
    .eq("trip_id", tripId);

  if (error) redirect(`/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath("/trips");
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  await supabase.from("trips").delete().eq("trip_id", tripId);
  revalidatePath("/trips");
  revalidatePath("/");
  redirect("/trips");
}

export async function toggleTripSharing(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const makePublic = formData.get("is_public") === "true";

  let shareToken: string | null = null;
  if (makePublic) {
    shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  }

  const { error } = await supabase
    .from("trips")
    .update({
      is_public: makePublic,
      share_token: makePublic ? shareToken : null,
      updated_at: new Date().toISOString(),
    })
    .eq("trip_id", tripId);

  if (error) redirect(`/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function addStop(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const cityId = String(formData.get("city_id") || "");
  const returnUrl = String(formData.get("return_url") || `/trips/${tripId}/build`);

  const { count } = await supabase
    .from("trip_stops")
    .select("stop_id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const startDate = String(formData.get("start_date") || "");
  const endDate = String(formData.get("end_date") || startDate);

  const { error } = await supabase.from("trip_stops").insert({
    trip_id: tripId,
    city_id: cityId,
    start_date: startDate || new Date().toISOString().split("T")[0],
    end_date: endDate || new Date().toISOString().split("T")[0],
    order_index: count ?? 0,
    section_budget_inr: numOrNull(formData.get("section_budget_inr")),
    notes: emptyToNull(formData.get("notes")),
  });

  if (error) redirect(`${returnUrl}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}`);
  redirect(returnUrl);
}

export async function deleteStop(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const stopId = String(formData.get("stop_id") || "");
  await supabase.from("trip_stops").delete().eq("stop_id", stopId);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/build`);
}

export async function updateStop(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const stopId = String(formData.get("stop_id") || "");
  const { error } = await supabase
    .from("trip_stops")
    .update({
      start_date: String(formData.get("start_date") || ""),
      end_date: String(formData.get("end_date") || ""),
      section_budget_inr: numOrNull(formData.get("section_budget_inr")),
      notes: emptyToNull(formData.get("notes")),
    })
    .eq("stop_id", stopId);

  if (error) redirect(`/trips/${tripId}/build?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/build`);
}

export async function addTripActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const stopId = String(formData.get("stop_id") || "");
  const returnUrl = String(formData.get("return_url") || `/trips/${tripId}/build`);

  const { error } = await supabase.from("trip_activities").insert({
    stop_id: stopId,
    activity_id: emptyToNull(formData.get("activity_id")),
    custom_name: emptyToNull(formData.get("custom_name")),
    day_number: Number(formData.get("day_number") || 1),
    planned_cost_inr: numOrNull(formData.get("planned_cost_inr")),
    scheduled_time: emptyToNull(formData.get("scheduled_time")),
    order_index: Number(formData.get("day_number") || 1),
    notes: emptyToNull(formData.get("notes")),
  });

  if (error) redirect(`${returnUrl}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}`);
  redirect(returnUrl);
}

export async function deleteTripActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const id = String(formData.get("trip_activity_id") || "");
  await supabase.from("trip_activities").delete().eq("trip_activity_id", id);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/build`);
}

export async function addExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const { error } = await supabase.from("expenses").insert({
    trip_id: tripId,
    category: String(formData.get("category") || "Other"),
    amount_inr: numOrNull(formData.get("amount_inr")) ?? 0,
    description: emptyToNull(formData.get("description")),
    stop_id: emptyToNull(formData.get("stop_id")),
    expense_date: emptyToNull(formData.get("expense_date")),
  });

  if (error) redirect(`/trips/${tripId}/budget?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}/budget`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/budget`);
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const expenseId = String(formData.get("expense_id") || "");
  await supabase.from("expenses").delete().eq("expense_id", expenseId);
  revalidatePath(`/trips/${tripId}/budget`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}/budget`);
}

export async function inviteCollaborator(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const userId = String(formData.get("user_id") || "").trim();
  const permission = String(formData.get("permission") || "view");

  if (!userId) {
    redirect(`/trips/${tripId}?error=User ID is required to invite`);
  }

  const { error } = await supabase.from("trip_collaborators").insert({
    trip_id: tripId,
    user_id: userId,
    permission: permission,
    status: "pending",
  });

  if (error) redirect(`/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}?message=Collaborator invite sent!`);
}

export async function removeCollaborator(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const userId = String(formData.get("user_id") || "");

  await supabase
    .from("trip_collaborators")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", userId);

  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function respondToInvite(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const status = String(formData.get("status") || "accepted");

  if (status === "declined") {
    await supabase
      .from("trip_collaborators")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("trip_collaborators")
      .update({ status })
      .eq("trip_id", tripId)
      .eq("user_id", user.id);
  }

  revalidatePath("/trips");
  redirect("/trips");
}
