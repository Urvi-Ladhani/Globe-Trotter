import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import type { Tables } from "@/lib/database.types";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";
import { CopyShareLinkButton } from "@/components/copy-share-link-button";
import {
  updateTripVisibility,
  inviteCollaborator,
  removeCollaborator,
  updateTrip,
  cloneTripAction,
} from "@/lib/actions/trips";
import {
  Calendar,
  Lock,
  Link as LinkIcon,
  Globe,
  Plus,
  Edit3,
  Wallet,
  Copy,
  Clock,
  Pin,
  ExternalLink,
} from "lucide-react";

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

  // Determine visibility mode
  const currentVisibility = trip.is_public
    ? "public"
    : trip.share_token
    ? "link_only"
    : "private";

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

  // Fetch registered travelers for invitation dropdown
  const { data: otherTravelers } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .neq("id", user.id)
    .limit(20);

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
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{trip.name}</h1>
              <span className="rounded-full bg-sky-50 px-3 py-0.5 text-xs font-bold capitalize text-[#0891B2] border border-sky-200">
                {trip.status}
              </span>
              {currentVisibility === "public" ? (
                <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Public
                </span>
              ) : currentVisibility === "link_only" ? (
                <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 border border-blue-200 flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" /> Link Only
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600 border border-slate-200 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Private
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-slate-600 font-medium flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{trip.start_date ?? "Dates TBD"} — {trip.end_date ?? "TBD"}</span>
            </p>
            {trip.description ? <p className="mt-2 max-w-2xl text-xs text-slate-600">{trip.description}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/trips/${tripId}/build`}
              className="btn-coral px-5 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Itinerary</span>
            </Link>
            <Link
              href={`/trips/${tripId}/budget`}
              className="btn-teal-outline px-4 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Budget & Expenses</span>
            </Link>
            <form action={cloneTripAction}>
              <input type="hidden" name="source_trip_id" value={tripId} />
              <button
                type="submit"
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
                title="Duplicate this itinerary as a template"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Clone Trip</span>
              </button>
            </form>
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
                <Link href={`/trips/${tripId}/build`} className="btn-coral mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Stop in Builder</span>
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
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{stop.start_date} to {stop.end_date}</span>
                        </p>
                      </div>
                      {stop.section_budget_inr ? (
                        <div className="text-right rounded-lg bg-white px-3 py-1.5 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Section Budget</span>
                          <p className="font-bold text-slate-900 text-sm">₹{stop.section_budget_inr.toLocaleString("en-IN")}</p>
                        </div>
                      ) : null}
                    </div>

                    {stop.notes ? (
                      <p className="mx-5 mt-4 rounded-lg bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-900 italic flex items-center gap-1.5">
                        <Pin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>{stop.notes}</span>
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
                                        {act.scheduled_time ? (
                                          <span className="flex items-center gap-1">
                                            • <Clock className="h-3 w-3" /> {act.scheduled_time}
                                          </span>
                                        ) : null}
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

          {/* Sidebar: Visibility, Sharing & Collaborators */}
          <div className="space-y-6">
            {/* Trip Visibility & Public Share Controls */}
            {isOwner ? (
              <section className="pacific-card p-5">
                <h3 className="font-bold text-slate-900 text-base">Trip Visibility & Sharing</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Control who can discover and view this trip itinerary.
                </p>

                <form action={updateTripVisibility} className="mt-4 flex flex-col gap-3 text-xs font-semibold text-slate-700">
                  <input type="hidden" name="trip_id" value={trip.trip_id} />
                  
                  <div className="space-y-2">
                    <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                      currentVisibility === "private" ? "border-[#0891B2] bg-sky-50/50" : "border-slate-200 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        defaultChecked={currentVisibility === "private"}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-slate-600" /> Private
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal">Only you and invited collaborators can view.</p>
                      </div>
                    </label>

                    <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                      currentVisibility === "link_only" ? "border-[#0891B2] bg-sky-50/50" : "border-slate-200 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="link_only"
                        defaultChecked={currentVisibility === "link_only"}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <LinkIcon className="h-3.5 w-3.5 text-blue-600" /> Shared via Secret Link
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal">Anyone with the link can view & request to join.</p>
                      </div>
                    </label>

                    <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                      currentVisibility === "public" ? "border-[#0891B2] bg-sky-50/50" : "border-slate-200 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        defaultChecked={currentVisibility === "public"}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-emerald-600" /> Public
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal">Visible to the traveler community and anyone with the link.</p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn-teal py-2 text-xs font-bold shadow-xs mt-1"
                  >
                    Update Visibility
                  </button>
                </form>

                {/* Secret Link Box if enabled */}
                {trip.share_token ? (
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Shareable Itinerary Link</p>
                    <div className="rounded-lg bg-slate-50 p-2 text-xs font-mono break-all border border-slate-200 text-slate-700">
                      /trips/share/{trip.share_token}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <CopyShareLinkButton shareUrl={`/trips/share/${trip.share_token}`} />
                      <Link
                        href={`/trips/share/${trip.share_token}`}
                        target="_blank"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <span>Preview View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Trip Collaborators Section */}
            <section className="pacific-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Travel Collaborators</h3>
                <span className="text-xs font-bold text-[#0891B2]">({collaborators?.length ?? 0})</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Invite travel partners to view or co-edit this trip itinerary.</p>

              <div className="mt-3 space-y-2">
                {(collaborators ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">No collaborators added yet.</p>
                ) : (
                  (collaborators ?? []).map((collab) => {
                    const p = profileMap.get(collab.user_id);
                    const name = p ? `${p.first_name} ${p.last_name ?? ""}`.trim() : collab.user_id;
                    return (
                      <div key={collab.user_id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-xs">
                        <div>
                          <p className="font-bold text-slate-900">{name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-semibold text-[#0891B2] capitalize">
                              {collab.permission === "edit" ? "Can Edit" : "View Only"}
                            </span>
                            <span className={`text-[10px] font-medium capitalize ${
                              collab.status === "accepted" ? "text-emerald-600" : "text-amber-600"
                            }`}>
                              • {collab.status}
                            </span>
                          </div>
                        </div>
                        {isOwner ? (
                          <form action={removeCollaborator}>
                            <input type="hidden" name="trip_id" value={tripId} />
                            <input type="hidden" name="user_id" value={collab.user_id} />
                            <button type="submit" className="text-xs font-semibold text-red-500 hover:underline">
                              Remove
                            </button>
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
                  
                  <label className="flex flex-col gap-1">Invite Traveler:
                    <input
                      name="user_identifier"
                      required
                      placeholder="Search traveler name or enter User ID..."
                      list="travelers-list"
                      className="pacific-input text-xs"
                    />
                    <datalist id="travelers-list">
                      {otherTravelers?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.first_name} {t.last_name ?? ""}
                        </option>
                      ))}
                    </datalist>
                  </label>

                  <label className="flex flex-col gap-1">Permission Level:
                    <select name="permission" className="pacific-input text-xs">
                      <option value="view">View only</option>
                      <option value="edit">Can Edit (Add stops & activities)</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="btn-coral py-2 font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Send Invitation</span>
                  </button>
                </form>
              ) : null}
            </section>

            {/* Trip Settings */}
            {isOwner ? (
              <section className="pacific-card p-5">
                <h3 className="font-bold text-slate-900 text-base">Trip Details</h3>
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
                    Save Trip Details
                  </button>
                </form>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
