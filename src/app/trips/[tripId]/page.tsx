import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import type { Tables } from "@/lib/database.types";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";
import { toggleTripSharing, inviteCollaborator, removeCollaborator, updateTrip } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

type TripActivityRow = Tables<"trip_activities">;

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { tripId } = await params;
  const { error, message } = await searchParams;
  const { supabase, user, profile } = await requireActiveUser();

  // Fetch the trip
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (!trip) notFound();

  const isOwner = trip.user_id === user.id;

  // Fetch stops with city info
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });

  // Fetch cities
  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = stopCityIds.length
    ? await supabase.from("cities").select("*").in("city_id", stopCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Fetch trip activities across all stops
  const stopIds = (stops ?? []).map((s) => s.stop_id);
  const { data: tripActivities } = stopIds.length
    ? await supabase
        .from("trip_activities")
        .select("*")
        .in("stop_id", stopIds)
        .order("day_number", { ascending: true })
    : { data: [] };

  // Map activity_id -> activity
  const actIds = (tripActivities ?? [])
    .map((ta) => ta.activity_id)
    .filter((id): id is string => !!id);

  const { data: activities } = actIds.length
    ? await supabase
        .from("activities")
        .select("activity_id, name, category, duration_minutes")
        .in("activity_id", actIds)
    : { data: [] };
  const activityById = new Map((activities ?? []).map((a) => [a.activity_id, a]));

  // Group activities per stop
  const activitiesByStop: Record<string, TripActivityRow[]> = {};
  for (const ta of (tripActivities ?? []) as TripActivityRow[]) {
    if (!activitiesByStop[ta.stop_id]) activitiesByStop[ta.stop_id] = [];
    activitiesByStop[ta.stop_id].push(ta);
  }

  // Fetch collaborators
  const { data: collaborators } = await supabase
    .from("trip_collaborators")
    .select("user_id, permission, status, invited_at")
    .eq("trip_id", tripId);

  const collabUserIds = (collaborators ?? []).map((c) => c.user_id);
  const { data: collabProfiles } = collabUserIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, role").in("id", collabUserIds)
    : { data: [] };
  const profileMap = new Map((collabProfiles ?? []).map((p) => [p.id, p]));

  // Calculate total planned activity cost
  const totalPlannedActivitiesInr = (tripActivities ?? []).reduce(
    (acc, cur) => acc + (cur.planned_cost_inr || 0),
    0
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Hero Header */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/50 to-transparent py-8 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{trip.name}</h1>
              <span className="rounded-full bg-sky-50 px-3 py-0.5 text-xs font-bold capitalize text-[#0891B2] border border-sky-200">
                {trip.status}
              </span>
              {trip.is_public ? (
                <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  Public Link Active
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm text-slate-600 font-medium">
              📅 {trip.start_date ?? "Dates TBD"} — {trip.end_date ?? "TBD"}
            </p>
            {trip.description ? <p className="mt-2 max-w-2xl text-xs text-slate-600">{trip.description}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/trips/${tripId}/build`}
              className="btn-coral px-5 py-2.5 text-xs font-bold shadow-md"
            >
              ✎ Edit Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/budget`}
              className="btn-teal-outline px-4 py-2 text-xs font-semibold shadow-xs"
            >
              💰 Budget & Expenses
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">{message}</p> : null}

        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="pacific-card p-4">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Destinations</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{stops?.length ?? 0}</p>
          </div>
          <div className="pacific-card p-4">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Scheduled Activities</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{tripActivities?.length ?? 0}</p>
          </div>
          <div className="pacific-card p-4">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Target Budget</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {trip.estimated_budget_inr ? `₹${trip.estimated_budget_inr.toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
          <div className="pacific-card p-4">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Planned Activity Cost</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">₹{totalPlannedActivitiesInr.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Main Content Grid: Day-by-Day Timeline + Sidebar */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Timeline */}
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900">Itinerary Schedule</h2>
            {(stops ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-teal-900/20 bg-white p-10 text-center">
                <p className="text-sm text-slate-600">No destination stops added yet.</p>
                <Link href={`/trips/${tripId}/build`} className="btn-coral mt-3 inline-block px-4 py-2 text-xs font-semibold">
                  + Add First Stop in Builder
                </Link>
              </div>
            ) : (
              (stops ?? []).map((stop, index) => {
                const city = cityMap.get(stop.city_id);
                const stopActs = activitiesByStop[stop.stop_id] ?? [];
                
                const dayGroups: Record<number, TripActivityRow[]> = {};
                for (const act of stopActs) {
                  if (!dayGroups[act.day_number]) dayGroups[act.day_number] = [];
                  dayGroups[act.day_number].push(act);
                }
                const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

                return (
                  <div key={stop.stop_id} className="pacific-card overflow-hidden">
                    <div className="border-b border-teal-900/10 bg-slate-50/70 p-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0891B2]">Stop {index + 1}</span>
                        <h3 className="text-xl font-extrabold text-slate-900">{city?.name ?? "City"}, {city?.country}</h3>
                        <p className="text-xs text-slate-500 font-medium">📅 {stop.start_date} to {stop.end_date}</p>
                      </div>
                      {stop.section_budget_inr ? (
                        <div className="text-right rounded-lg bg-white px-3 py-1.5 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Section Budget</span>
                          <p className="font-bold text-slate-900 text-sm">₹{stop.section_budget_inr.toLocaleString("en-IN")}</p>
                        </div>
                      ) : null}
                    </div>

                    {stop.notes ? (
                      <p className="mx-5 mt-4 rounded-lg bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-900 italic">
                        📌 {stop.notes}
                      </p>
                    ) : null}

                    {/* Day Schedule */}
                    <div className="p-5 space-y-4">
                      {sortedDays.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No activities scheduled for this stop yet.</p>
                      ) : (
                        sortedDays.map((dayNum) => (
                          <div key={dayNum} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0891B2] mb-2.5">
                              Day {dayNum}
                            </h4>
                            <div className="space-y-2">
                              {dayGroups[dayNum].map((act) => {
                                const catalogAct = act.activity_id ? activityById.get(act.activity_id) : null;
                                const title = act.custom_name || catalogAct?.name || "Activity";
                                return (
                                  <div key={act.trip_activity_id} className="flex items-center justify-between rounded-lg bg-white p-3 text-xs border border-slate-200 shadow-xs">
                                    <div>
                                      <span className="font-bold text-slate-900 text-sm">{title}</span>
                                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        {catalogAct?.category ? <span className="rounded bg-sky-50 text-[#0891B2] px-1.5 py-0.5 text-[10px] font-semibold">{catalogAct.category}</span> : null}
                                        {act.scheduled_time ? <span>• ⏰ {act.scheduled_time}</span> : null}
                                        {catalogAct?.duration_minutes ? <span>• {catalogAct.duration_minutes} mins</span> : null}
                                      </div>
                                      {act.notes ? <p className="text-xs text-slate-500 mt-1">Note: {act.notes}</p> : null}
                                    </div>
                                    <div className="text-right font-bold text-slate-800 text-sm">
                                      {act.planned_cost_inr ? `₹${act.planned_cost_inr.toLocaleString("en-IN")}` : "—"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Settings */}
            {isOwner ? (
              <section className="pacific-card p-5">
                <h3 className="font-bold text-slate-900 text-base">Trip Settings</h3>
                <form action={updateTrip} className="mt-3 flex flex-col gap-3 text-xs font-semibold text-slate-700">
                  <input type="hidden" name="trip_id" value={trip.trip_id} />
                  <input type="hidden" name="name" value={trip.name} />
                  <label className="flex flex-col gap-1">Status
                    <select name="status" defaultValue={trip.status} className="pacific-input">
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">Estimated Budget (INR)
                    <input type="number" name="estimated_budget_inr" defaultValue={trip.estimated_budget_inr ?? undefined} className="pacific-input" />
                  </label>
                  <ImageUploadInput
                    name="cover_photo_url"
                    label="Trip Cover Photo"
                    defaultValue={trip.cover_photo_url ?? ""}
                    folder="trips"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  <button type="submit" className="btn-teal py-2 text-xs font-bold">
                    Save Trip Settings
                  </button>
                </form>
              </section>
            ) : null}

            {/* Public Sharing */}
            <section className="pacific-card p-5">
              <h3 className="font-bold text-slate-900 text-base">Public Itinerary Link</h3>
              <p className="mt-1 text-xs text-slate-500">
                Share a read-only itinerary link with friends or family (expenses are never shown).
              </p>

              {trip.is_public && trip.share_token ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-slate-50 p-2.5 text-xs font-mono break-all border border-slate-200 text-slate-700">
                    /trips/share/{trip.share_token}
                  </div>
                  <Link
                    href={`/trips/share/${trip.share_token}`}
                    target="_blank"
                    className="block text-center rounded-lg border border-[#0891B2] bg-white py-1.5 text-xs font-bold text-[#0891B2] hover:bg-sky-50"
                  >
                    Open Public View ↗
                  </Link>
                </div>
              ) : null}

              {isOwner ? (
                <form action={toggleTripSharing} className="mt-4">
                  <input type="hidden" name="trip_id" value={trip.trip_id} />
                  <input type="hidden" name="is_public" value={trip.is_public ? "false" : "true"} />
                  <button
                    type="submit"
                    className={`w-full rounded-lg py-2 text-xs font-bold text-white transition-colors ${
                      trip.is_public ? "bg-slate-700 hover:bg-slate-800" : "btn-coral"
                    }`}
                  >
                    {trip.is_public ? "Disable Public Sharing" : "Enable Public Sharing"}
                  </button>
                </form>
              ) : null}
            </section>

            {/* Trip Collaborators */}
            <section className="pacific-card p-5">
              <h3 className="font-bold text-slate-900 text-base">Collaborators</h3>
              <p className="mt-1 text-xs text-slate-500">Invite travel partners to view or edit this trip.</p>

              <div className="mt-3 space-y-2">
                {(collaborators ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">No collaborators added yet.</p>
                ) : (
                  (collaborators ?? []).map((collab) => {
                    const p = profileMap.get(collab.user_id);
                    const name = p ? `${p.first_name} ${p.last_name ?? ""}`.trim() : collab.user_id;
                    return (
                      <div key={collab.user_id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{name}</p>
                          <p className="text-slate-500 text-[11px] capitalize">{collab.permission} · {collab.status}</p>
                        </div>
                        {isOwner ? (
                          <form action={removeCollaborator}>
                            <input type="hidden" name="trip_id" value={tripId} />
                            <input type="hidden" name="user_id" value={collab.user_id} />
                            <button type="submit" className="text-xs font-medium text-red-500 hover:underline">Remove</button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              {isOwner ? (
                <form action={inviteCollaborator} className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700">
                  <input type="hidden" name="trip_id" value={tripId} />
                  <label className="flex flex-col gap-1">User ID to invite:
                    <input
                      name="user_id"
                      required
                      placeholder="e.g. user uuid"
                      className="pacific-input text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1">Permission:
                    <select name="permission" className="pacific-input text-xs">
                      <option value="view">View only</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="btn-coral py-2 font-bold shadow-xs"
                  >
                    Send Invitation
                  </button>
                </form>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
