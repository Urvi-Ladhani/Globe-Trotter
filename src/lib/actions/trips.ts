import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { emptyToNull, numOrNull } from "@/lib/auth";

export async function createTrip(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/trips/new?error=Name is required");
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name,
      start_date: String(formData.get("start_date") || "") || undefined,
      end_date: String(formData.get("end_date") || "") || undefined,
      description: emptyToNull(formData.get("description")),
    })
    .select("trip_id")
    .single();
  if (error) redirect(`/trips/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/trips/${data.trip_id}/build`);
}

export async function updateTrip(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const { error } = await supabase
    .from("trips")
    .update({
      name: String(formData.get("name") || "").trim(),
      start_date: String(formData.get("start_date") || "") || undefined,
      end_date: String(formData.get("end_date") || "") || undefined,
      description: emptyToNull(formData.get("description")),
      status: String(formData.get("status") || "upcoming"),
      estimated_budget_inr: numOrNull(formData.get("estimated_budget_inr")),
    })
    .eq("trip_id", tripId);
  if (error) redirect(`/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  await supabase.from("trips").delete().eq("trip_id", tripId);
  revalidatePath("/trips");
  redirect("/trips");
}

export async function addStop(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const cityId = String(formData.get("city_id") || "");
  const { count } = await supabase
    .from("trip_stops")
    .select("stop_id", { count: "exact", head: true })
    .eq("trip_id", tripId);
  const { error } = await supabase.from("trip_stops").insert({
    trip_id: tripId,
    city_id: cityId,
    start_date: String(formData.get("start_date") || ""),
    end_date: String(formData.get("end_date") || ""),
    order_index: count ?? 0,
    section_budget_inr: numOrNull(formData.get("section_budget_inr")),
    notes: emptyToNull(formData.get("notes")),
  });
  if (error) redirect(`/trips/${tripId}/build?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}/build`);
  redirect(`/trips/${tripId}/build`);
}

export async function deleteStop(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const stopId = String(formData.get("stop_id") || "");
  await supabase.from("trip_stops").delete().eq("stop_id", stopId);
  revalidatePath(`/trips/${tripId}/build`);
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
  redirect(`/trips/${tripId}/build`);
}

export async function addTripActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const { error } = await supabase.from("trip_activities").insert({
    stop_id: String(formData.get("stop_id") || ""),
    activity_id: emptyToNull(formData.get("activity_id")),
    custom_name: emptyToNull(formData.get("custom_name")),
    day_number: Number(formData.get("day_number") || 1),
    planned_cost_inr: numOrNull(formData.get("planned_cost_inr")),
    scheduled_time: emptyToNull(formData.get("scheduled_time")),
    order_index: Number(formData.get("day_number") || 1),
    notes: emptyToNull(formData.get("notes")),
  });
  if (error) redirect(`/trips/${tripId}/build?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}/build`);
  redirect(`/trips/${tripId}/build`);
}

export async function deleteTripActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const id = String(formData.get("trip_activity_id") || "");
  await supabase.from("trip_activities").delete().eq("trip_activity_id", id);
  revalidatePath(`/trips/${tripId}/build`);
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
  redirect(`/trips/${tripId}/budget`);
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const expenseId = String(formData.get("expense_id") || "");
  await supabase.from("expenses").delete().eq("expense_id", expenseId);
  revalidatePath(`/trips/${tripId}/budget`);
  redirect(`/trips/${tripId}/budget`);
}

// Trip collaboration: respond to an invite. Creating invites by email is not
// possible from the client because `profiles` has no email column
// (email lives only in auth.users, not exposed to RLS). Invites must be
// created via a DB RPC/trigger with access to auth.users. See README note.
export async function respondToInvite(formData: FormData) {
  const { supabase } = await requireUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const tripId = String(formData.get("trip_id") || "");
  const status = String(formData.get("status") || "accepted");
  await supabase
    .from("trip_collaborators")
    .update({ status })
    .eq("trip_id", tripId)
    .eq("user_id", user.id);
  revalidatePath("/trips");
  redirect("/trips");
}