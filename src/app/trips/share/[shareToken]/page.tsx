import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type TripActivityRow = Tables<"trip_activities">;

export default async function PublicTripSharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const supabase = await createClient();

  // Query trip by share_token
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("share_token", shareToken)
    .eq("is_public", true)
    .maybeSingle();

  if (!trip) notFound();

  // Fetch stops
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", trip.trip_id)
    .order("order_index", { ascending: true });

  // Fetch cities
  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = stopCityIds.length
    ? await supabase.from("cities").select("*").in("city_id", stopCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Fetch trip activities across stops
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
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold">GlobeTrotter</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-zinc-600 hover:underline">Log in</Link>
            <Link href="/register" className="rounded-lg bg-zinc-900 px-3 py-1.5 font-semibold text-white hover:bg-zinc-700">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Shared Itinerary
              </span>
              <h1 className="mt-2 text-3xl font-bold">{trip.name}</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {trip.start_date ?? "TBD"} – {trip.end_date ?? "TBD"}
              </p>
            </div>
          </div>
          {trip.description ? (
            <p className="mt-4 text-sm text-zinc-600 border-t pt-3">{trip.description}</p>
          ) : null}
        </div>

        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold">Trip Itinerary</h2>

          {(stops ?? []).length === 0 ? (
            <p className="rounded-lg border bg-white p-6 text-sm text-zinc-500">No stops in this itinerary.</p>
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
                <div key={stop.stop_id} className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="border-b pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stop {index + 1}</span>
                    <h3 className="text-xl font-bold">{city?.name ?? "City"}, {city?.country}</h3>
                    <p className="text-xs text-zinc-500">{stop.start_date} to {stop.end_date}</p>
                    {stop.notes ? <p className="mt-2 text-xs text-zinc-600 italic">{stop.notes}</p> : null}
                  </div>

                  <div className="mt-4 space-y-3">
                    {sortedDays.length === 0 ? (
                      <p className="text-xs text-zinc-400">No scheduled activities.</p>
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
                                    </div>
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
