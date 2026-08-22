import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { CopyShareLinkButton } from "@/components/copy-share-link-button";
import { joinTripViaShareLink, cloneTripAction } from "@/lib/actions/trips";
import {
  Compass,
  Calendar,
  Globe,
  Link as LinkIcon,
  Copy,
  UserPlus,
  ArrowRight,
  Pin,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

type TripActivityRow = Tables<"trip_activities">;

export default async function PublicTripSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { shareToken } = await params;
  const { error, message } = await searchParams;
  const supabase = await createClient();

  // 1. Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Query trip by share_token
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("share_token", shareToken)
    .maybeSingle();

  // If no trip found or if trip is neither public nor has share_token
  if (!trip) notFound();

  // 3. Fetch creator profile
  const { data: creator } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, photo_url")
    .eq("id", trip.user_id)
    .maybeSingle();

  const creatorName = creator ? `${creator.first_name} ${creator.last_name ?? ""}`.trim() : "Traveler";

  // 4. Check if current logged-in user is already a collaborator or owner
  let isCollaboratorOrOwner = false;
  if (user) {
    if (user.id === trip.user_id) {
      isCollaboratorOrOwner = true;
    } else {
      const { data: collab } = await supabase
        .from("trip_collaborators")
        .select("status")
        .eq("trip_id", trip.trip_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (collab?.status === "accepted") {
        isCollaboratorOrOwner = true;
      }
    }
  }

  // 5. Fetch stops
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", trip.trip_id)
    .order("order_index", { ascending: true });

  // 6. Fetch cities
  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = stopCityIds.length
    ? await supabase.from("cities").select("*").in("city_id", stopCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // 7. Fetch trip activities across stops
  const stopIds = (stops ?? []).map((s) => s.stop_id);
  const { data: tripActivities } = stopIds.length
    ? await supabase
        .from("trip_activities")
        .select("*")
        .in("stop_id", stopIds)
        .order("day_number", { ascending: true })
    : { data: [] };

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

  const activitiesByStop: Record<string, TripActivityRow[]> = {};
  for (const ta of (tripActivities ?? []) as TripActivityRow[]) {
    if (!activitiesByStop[ta.stop_id]) activitiesByStop[ta.stop_id] = [];
    activitiesByStop[ta.stop_id].push(ta);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0B4F6C] text-white shadow-md border-b border-[#083D54]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5A5F] text-white shadow-xs">
              <Compass className="h-4 w-4" />
            </span>
            <span>Globe<span className="text-[#38BDF8]">Trotter</span></span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold">
            {user ? (
              <Link href="/trips" className="text-sky-100 hover:text-white">
                My Trips
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sky-100 hover:text-white">
                  Log in
                </Link>
                <Link href="/register" className="btn-coral px-3.5 py-1.5 shadow-xs">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">{message}</p> : null}

        {/* Hero Card */}
        <div className="pacific-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  {trip.is_public ? (
                    <>
                      <Globe className="h-3 w-3" />
                      <span>Public Itinerary</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3 w-3" />
                      <span>Shared via Link</span>
                    </>
                  )}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-0.5 text-xs font-bold text-[#0891B2] border border-sky-200 capitalize">
                  {trip.status}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{trip.name}</h1>
              <p className="mt-1 text-sm font-medium text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{trip.start_date ?? "Dates TBD"} – {trip.end_date ?? "TBD"}</span>
              </p>

              {/* Creator info */}
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                <span>Planned by</span>
                <span className="font-bold text-slate-900">{creatorName}</span>
              </div>
            </div>

            {/* Action Buttons: Join, Clone, Copy Link */}
            <div className="flex flex-wrap items-center gap-2.5">
              <CopyShareLinkButton shareUrl={`/trips/share/${shareToken}`} />

              {user ? (
                <>
                  {isCollaboratorOrOwner ? (
                    <Link
                      href={`/trips/${trip.trip_id}`}
                      className="btn-teal px-4 py-2 text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <span>Open in My Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <form action={joinTripViaShareLink}>
                      <input type="hidden" name="trip_id" value={trip.trip_id} />
                      <input type="hidden" name="share_token" value={shareToken} />
                      <button
                        type="submit"
                        className="btn-coral px-4 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Join as Collaborator</span>
                      </button>
                    </form>
                  )}

                  <form action={cloneTripAction}>
                    <input type="hidden" name="source_trip_id" value={trip.trip_id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5"
                      title="Duplicate this itinerary into your own trips"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Itinerary</span>
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href={`/register?next=/trips/share/${shareToken}`}
                  className="btn-coral px-4 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <span>Sign up to Join / Copy Trip</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {trip.description ? (
            <p className="mt-4 text-xs text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">{trip.description}</p>
          ) : null}
        </div>

        {/* Itinerary Schedule */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Itinerary Breakdown ({stops?.length ?? 0} Destinations)</h2>

          {(stops ?? []).length === 0 ? (
            <div className="pacific-card p-10 text-center text-xs text-slate-400">
              No stops recorded in this itinerary yet.
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
                  <div className="border-b border-teal-900/10 bg-slate-50/70 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0891B2]">Stop #{index + 1}</span>
                    <h3 className="text-xl font-extrabold text-slate-900">{city?.name ?? "City"}, {city?.country}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{stop.start_date} to {stop.end_date}</span>
                    </p>
                    {stop.notes ? (
                      <p className="mt-2 text-xs text-slate-600 italic flex items-center gap-1.5">
                        <Pin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>{stop.notes}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="p-5 space-y-4">
                    {sortedDays.length === 0 ? (
                      <p className="text-xs text-slate-400">No scheduled activities listed.</p>
                    ) : (
                      sortedDays.map((dayNum) => (
                        <div key={dayNum} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0891B2] mb-2.5">Day {dayNum}</h4>
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
      </main>
    </div>
  );
}
