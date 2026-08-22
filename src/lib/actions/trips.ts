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
  const visibility = String(formData.get("visibility") || "private");

  let isPublic = false;
  let shareToken: string | null = null;

  if (visibility === "public") {
    isPublic = true;
    shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  } else if (visibility === "link_only") {
    isPublic = false;
    shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      description,
      cover_photo_url: coverPhotoUrl,
      estimated_budget_inr: estimatedBudgetInr,
      status: "upcoming",
      is_public: isPublic,
      share_token: shareToken,
    })
    .select("trip_id")
    .single();

  if (error) redirect(`/trips/new?error=${encodeURIComponent(error.message)}`);
  
  // If city_id was provided to add initial stop
  const initialCityId = emptyToNull(formData.get("initial_city_id"));
  if (initialCityId && data?.trip_id) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("trip_stops").insert({
      trip_id: data.trip_id,
      city_id: initialCityId,
      start_date: startDate || today,
      end_date: endDate || startDate || today,
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

  const status = String(formData.get("status") || "upcoming");
  const estimatedBudgetInr = numOrNull(formData.get("estimated_budget_inr"));
  const coverPhotoUrl = emptyToNull(formData.get("cover_photo_url"));

  const { error } = await supabase
    .from("trips")
    .update({
      name,
      status,
      estimated_budget_inr: estimatedBudgetInr,
      cover_photo_url: coverPhotoUrl,
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

export async function updateTripVisibility(formData: FormData) {
  const { supabase } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const visibility = String(formData.get("visibility") || "private"); // "private" | "link_only" | "public"

  let isPublic = false;
  let shareToken: string | null = null;

  if (visibility === "public") {
    isPublic = true;
    shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  } else if (visibility === "link_only") {
    isPublic = false;
    shareToken = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  } else {
    // Private
    isPublic = false;
    shareToken = null;
  }

  const { error } = await supabase
    .from("trips")
    .update({
      is_public: isPublic,
      share_token: shareToken,
      updated_at: new Date().toISOString(),
    })
    .eq("trip_id", tripId);

  if (error) redirect(`/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  redirect(`/trips/${tripId}?message=Visibility updated to ${visibility.replace("_", " ")}`);
}

export async function toggleTripSharing(formData: FormData) {
  return updateTripVisibility(formData);
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
  const { supabase, user } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const targetUserIdentifier = String(formData.get("user_identifier") || formData.get("user_id") || "").trim();
  const permission = String(formData.get("permission") || "view");

  if (!targetUserIdentifier) {
    redirect(`/trips/${tripId}?error=Please specify a user to invite`);
  }

  // Look up user by ID or by matching profile name
  let targetUserId = targetUserIdentifier;

  // Check if identifier is already a valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserIdentifier);

  if (!isUuid) {
    // Search profile by name
    const { data: matchedProfile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .or(`first_name.ilike.%${targetUserIdentifier}%,last_name.ilike.%${targetUserIdentifier}%`)
      .limit(1)
      .maybeSingle();

    if (matchedProfile) {
      targetUserId = matchedProfile.id;
    } else {
      redirect(`/trips/${tripId}?error=Could not find a traveler matching '${targetUserIdentifier}'`);
    }
  }

  if (targetUserId === user.id) {
    redirect(`/trips/${tripId}?error=You are already the owner of this trip`);
  }

  const { error } = await supabase.from("trip_collaborators").insert({
    trip_id: tripId,
    user_id: targetUserId,
    permission: permission,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      redirect(`/trips/${tripId}?error=This user is already invited or a collaborator`);
    }
    redirect(`/trips/${tripId}?error=${encodeURIComponent(error.message)}`);
  }

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

export async function joinTripViaShareLink(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = String(formData.get("trip_id") || "");
  const shareToken = String(formData.get("share_token") || "");

  if (!tripId) redirect("/");

  // Check if already collaborator or owner
  const { data: trip } = await supabase
    .from("trips")
    .select("user_id")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (trip?.user_id === user.id) {
    redirect(`/trips/${tripId}`);
  }

  const { error } = await supabase.from("trip_collaborators").upsert({
    trip_id: tripId,
    user_id: user.id,
    permission: "view",
    status: "accepted",
  });

  if (error) {
    redirect(`/trips/share/${shareToken}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}?message=You have joined this trip as a collaborator!`);
}

export async function cloneTripAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const sourceTripId = String(formData.get("source_trip_id") || "");

  if (!sourceTripId) redirect("/trips");

  // 1. Fetch source trip
  const { data: sourceTrip } = await supabase
    .from("trips")
    .select("*")
    .eq("trip_id", sourceTripId)
    .maybeSingle();

  if (!sourceTrip) redirect("/trips?error=Source trip not found");

  // 2. Insert new cloned trip
  const { data: newTrip, error: tripErr } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name: `${sourceTrip.name} (Copy)`,
      description: sourceTrip.description,
      cover_photo_url: sourceTrip.cover_photo_url,
      start_date: sourceTrip.start_date || undefined,
      end_date: sourceTrip.end_date || undefined,
      estimated_budget_inr: sourceTrip.estimated_budget_inr,
      source_trip_id: sourceTrip.trip_id,
      status: "planning",
      is_public: false,
    })
    .select("trip_id")
    .single();

  if (tripErr || !newTrip) {
    redirect(`/trips?error=${encodeURIComponent(tripErr?.message || "Failed to clone trip")}`);
  }

  // 3. Fetch source stops
  const { data: sourceStops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", sourceTripId)
    .order("order_index", { ascending: true });

  const stopIdMap = new Map<string, string>();

  for (const stop of sourceStops ?? []) {
    const { data: newStop } = await supabase
      .from("trip_stops")
      .insert({
        trip_id: newTrip.trip_id,
        city_id: stop.city_id,
        start_date: stop.start_date,
        end_date: stop.end_date,
        order_index: stop.order_index,
        section_budget_inr: stop.section_budget_inr,
        notes: stop.notes,
      })
      .select("stop_id")
      .single();

    if (newStop) {
      stopIdMap.set(stop.stop_id, newStop.stop_id);
    }
  }

  // 4. Fetch source activities
  const sourceStopIds = (sourceStops ?? []).map((s) => s.stop_id);
  const { data: sourceActivities } = sourceStopIds.length
    ? await supabase
        .from("trip_activities")
        .select("*")
        .in("stop_id", sourceStopIds)
    : { data: [] };

  for (const act of sourceActivities ?? []) {
    const newStopId = stopIdMap.get(act.stop_id);
    if (newStopId) {
      await supabase.from("trip_activities").insert({
        stop_id: newStopId,
        activity_id: act.activity_id,
        custom_name: act.custom_name,
        day_number: act.day_number,
        scheduled_time: act.scheduled_time,
        planned_cost_inr: act.planned_cost_inr,
        order_index: act.order_index,
        notes: act.notes,
      });
    }
  }

  revalidatePath("/trips");
  redirect(`/trips/${newTrip.trip_id}/build?message=Trip copied to your account!`);
}
