import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { toggleTripSharing, inviteCollaborator, removeCollaborator, updateTrip } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

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
  const activitiesByStop: Record<string, NonNullable<typeof tripActivities>> = {};
  for (const ta of tripActivities ?? []) {
    (activitiesByStop[ta.stop_id] ??= []).push(ta);
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
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Header and Controls */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{trip.name}</h1>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-700">
                {trip.status}
              </span>
              {trip.is_public ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Public
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {trip.start_date ?? "Start TBD"} — {trip.end_date ?? "End TBD"}
            </p>
            {trip.description ? <p className="mt-2 text-sm text-zinc-600 max-w-2xl">{trip.description}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/trips/${tripId}/build`}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Edit Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/budget`}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Budget & Expenses
            </Link>
          </div>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        {/* Quick Stats Bar */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-zinc-500">Stops</p>
            <p className="mt-1 text-xl font-bold">{stops?.length ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-zinc-500">Planned Activities</p>
            <p className="mt-1 text-xl font-bold">{tripActivities?.length ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-zinc-500">Estimated Budget</p>
            <p className="mt-1 text-xl font-bold">
              {trip.estimated_budget_inr ? `₹${trip.estimated_budget_inr.toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-zinc-500">Total Activity Cost</p>
            <p className="mt-1 text-xl font-bold">₹{totalPlannedActivitiesInr.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Main Content Grid: Itinerary + Sidebar */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Itinerary Sections */}
          <div className="space-y-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Itinerary Stops & Schedule</h2>
            {(stops ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-zinc-500">
                <p>No stops added to this trip yet.</p>
                <Link href={`/trips/${tripId}/build`} className="mt-2 inline-block font-semibold text-blue-600 underline">
                  Add stops in the builder
                </Link>
              </div>
            ) : (
              (stops ?? []).map((stop, index) => {
                const city = cityMap.get(stop.city_id);
                const stopActs = activitiesByStop[stop.stop_id] ?? [];
                
                // Group activities by day_number
                const dayGroups: Record<number, typeof stopActs> = {};
                for (const act of stopActs) {
                  (dayGroups[act.day_number] ??= []).push(act);
                }
                const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

                return (
                  <div key={stop.stop_id} className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between border-b pb-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stop {index + 1}</span>
                        <h3 className="text-xl font-bold">{city?.name ?? "City"}, {city?.country}</h3>
                        <p className="text-xs text-zinc-500">{stop.start_date} to {stop.end_date}</p>
                      </div>
                      {stop.section_budget_inr ? (
                        <div className="text-right">
                          <span className="text-xs text-zinc-500">Section Budget</span>
                          <p className="font-semibold text-zinc-800">₹{stop.section_budget_inr.toLocaleString("en-IN")}</p>
                        </div>
                      ) : null}
                    </div>

                    {stop.notes ? (
                      <p className="mt-3 rounded bg-zinc-50 p-2.5 text-xs text-zinc-600 italic">{stop.notes}</p>
                    ) : null}

                    {/* Day-by-Day Activities */}
                    <div className="mt-4 space-y-4">
                      {sortedDays.length === 0 ? (
                        <p className="text-xs text-zinc-400">No activities scheduled for this stop.</p>
                      ) : (
                        sortedDays.map((dayNum) => (
                          <div key={dayNum} className="rounded-md border border-zinc-100 bg-zinc-50/50 p-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">Day {dayNum}</h4>
                            <div className="space-y-2">
                              {dayGroups[dayNum].map((act) => {
                                const catalogAct = act.activity_id ? activityById.get(act.activity_id) : null;
                                const title = act.custom_name || catalogAct?.name || "Activity";
                                return (
                                  <div key={act.trip_activity_id} className="flex items-center justify-between rounded bg-white p-2.5 text-sm border shadow-xs">
                                    <div>
                                      <span className="font-medium text-zinc-900">{title}</span>
                                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                        {catalogAct?.category ? <span>{catalogAct.category}</span> : null}
                                        {act.scheduled_time ? <span>• {act.scheduled_time}</span> : null}
                                        {catalogAct?.duration_minutes ? <span>• {catalogAct.duration_minutes} mins</span> : null}
                                      </div>
                                      {act.notes ? <p className="text-xs text-zinc-500 mt-1">{act.notes}</p> : null}
                                    </div>
                                    <div className="text-right font-medium text-zinc-700">
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

          {/* Sidebar: Public Sharing & Collaboration & Status */}
          <div className="space-y-6">
            {/* Trip Settings */}
            {isOwner ? (
              <section className="rounded-lg border bg-white p-5 shadow-sm">
                <h3 className="font-semibold">Trip Status & Details</h3>
                <form action={updateTrip} className="mt-3 flex flex-col gap-3 text-sm">
                  <input type="hidden" name="trip_id" value={trip.trip_id} />
                  <input type="hidden" name="name" value={trip.name} />
                  <label className="flex flex-col gap-1 text-xs font-medium">Status
                    <select name="status" defaultValue={trip.status} className="rounded border px-2 py-1.5 text-sm">
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium">Estimated Budget (INR)
                    <input type="number" name="estimated_budget_inr" defaultValue={trip.estimated_budget_inr ?? undefined} className="rounded border px-2 py-1.5 text-sm" />
                  </label>
                  <button type="submit" className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700">Update Trip Settings</button>
                </form>
              </section>
            ) : null}

            {/* Public Sharing */}
            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="font-semibold">Public Share Link</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Share a read-only itinerary link with friends or family (expenses are never shown).
              </p>

              {trip.is_public && trip.share_token ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded bg-zinc-50 p-2 text-xs font-mono break-all border">
                    /trips/share/{trip.share_token}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/trips/share/${trip.share_token}`}
                      target="_blank"
                      className="rounded border px-3 py-1 text-xs font-medium hover:bg-zinc-50"
                    >
                      Open Link ↗
                    </Link>
                  </div>
                </div>
              ) : null}

              {isOwner ? (
                <form action={toggleTripSharing} className="mt-4">
                  <input type="hidden" name="trip_id" value={trip.trip_id} />
                  <input type="hidden" name="is_public" value={trip.is_public ? "false" : "true"} />
                  <button
                    type="submit"
                    className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                      trip.is_public ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {trip.is_public ? "Disable Public Sharing" : "Enable Public Sharing"}
                  </button>
                </form>
              ) : null}
            </section>

            {/* Trip Collaborators */}
            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="font-semibold">Collaborators</h3>
              <p className="mt-1 text-xs text-zinc-500">Invite travel partners to view or edit this trip.</p>

              <div className="mt-3 space-y-2">
                {(collaborators ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-400">No collaborators added yet.</p>
                ) : (
                  (collaborators ?? []).map((collab) => {
                    const p = profileMap.get(collab.user_id);
                    const name = p ? `${p.first_name} ${p.last_name ?? ""}`.trim() : collab.user_id;
                    return (
                      <div key={collab.user_id} className="flex items-center justify-between rounded border p-2 text-xs">
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-zinc-500 capitalize">{collab.permission} · {collab.status}</p>
                        </div>
                        {isOwner ? (
                          <form action={removeCollaborator}>
                            <input type="hidden" name="trip_id" value={tripId} />
                            <input type="hidden" name="user_id" value={collab.user_id} />
                            <button type="submit" className="text-red-500 hover:underline">Remove</button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              {isOwner ? (
                <form action={inviteCollaborator} className="mt-4 flex flex-col gap-2 border-t pt-3 text-xs">
                  <input type="hidden" name="trip_id" value={tripId} />
                  <label className="flex flex-col gap-1 font-medium">
                    User ID to invite:
                    <input
                      name="user_id"
                      required
                      placeholder="e.g. user uuid"
                      className="rounded border px-2 py-1 text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-medium">
                    Permission:
                    <select name="permission" className="rounded border px-2 py-1 text-xs">
                      <option value="view">View only</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="mt-1 rounded bg-zinc-900 px-3 py-1.5 font-semibold text-white hover:bg-zinc-700"
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
