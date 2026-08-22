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
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <header className="sticky top-0 z-40 bg-[#0B4F6C] text-white shadow-md border-b border-[#083D54]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF5A5F] text-white shadow-xs">
              ✈
            </span>
            <span>Globe<span className="text-[#38BDF8]">Trotter</span></span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link href="/login" className="text-sky-100 hover:text-white">Log in</Link>
            <Link href="/register" className="btn-coral px-3.5 py-1.5 shadow-xs">
              Create Free Account
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
        <div className="pacific-card p-6 sm:p-8">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            Shared Public Itinerary
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{trip.name}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            📅 {trip.start_date ?? "TBD"} – {trip.end_date ?? "TBD"}
          </p>
          {trip.description ? (
            <p className="mt-4 text-xs text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">{trip.description}</p>
          ) : null}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Itinerary Highlights</h2>

          {(stops ?? []).length === 0 ? (
            <p className="pacific-card p-8 text-center text-xs text-slate-400">No stops recorded in this itinerary.</p>
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
                    <p className="text-xs text-slate-500 font-medium">📅 {stop.start_date} to {stop.end_date}</p>
                    {stop.notes ? <p className="mt-2 text-xs text-slate-600 italic">📌 {stop.notes}</p> : null}
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
                                      {act.scheduled_time ? <span>• ⏰ {act.scheduled_time}</span> : null}
                                      {catalogAct?.duration_minutes ? <span>• {catalogAct.duration_minutes} mins</span> : null}
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
