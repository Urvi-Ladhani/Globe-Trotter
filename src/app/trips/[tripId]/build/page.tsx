import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addStop, updateStop, deleteStop, addTripActivity, deleteTripActivity } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function BuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireUser();

  const { data: trip } = await supabase.from("trips").select("*").eq("trip_id", tripId).maybeSingle();
  if (!trip) notFound();

  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("order_index");

  const { data: allCities } = await supabase.from("cities").select("city_id,name,country").order("name");
  const cityById = new Map((allCities ?? []).map((c) => [c.city_id, c]));

  const { data: allActivities } = await supabase
    .from("activities")
    .select("activity_id,name,category,cost_estimate_inr")
    .eq("is_approved", true)
    .order("name")
    .limit(500);
  const activityById = new Map((allActivities ?? []).map((a) => [a.activity_id, a]));

  const { data: tripActivities } = stops?.length
    ? await supabase.from("trip_activities").select("*").in("stop_id", stops.map((s) => s.stop_id))
    : { data: [] };

  type TripActivityRow = NonNullable<typeof tripActivities>[number];
  const byStop: Record<string, TripActivityRow[]> = {};
  for (const ta of (tripActivities ?? []) as TripActivityRow[]) {
    if (!byStop[ta.stop_id]) byStop[ta.stop_id] = [];
    byStop[ta.stop_id].push(ta);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">{trip.name}</h1>
      <a href={`/trips/${tripId}`} className="text-sm text-blue-600 underline">View itinerary</a>
      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="font-semibold">Add a stop</h2>
        <form action={addStop} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="trip_id" value={tripId} />
          <select name="city_id" required className="rounded-lg border px-2 py-1 text-sm">
            <option value="">Select city…</option>
            {allCities?.map((c) => (
              <option key={c.city_id} value={c.city_id}>{c.name}, {c.country}</option>
            ))}
          </select>
          <input type="date" name="start_date" className="rounded-lg border px-2 py-1 text-sm" />
          <input type="date" name="end_date" className="rounded-lg border px-2 py-1 text-sm" />
          <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-1 text-sm font-semibold text-white">Add section</button>
        </form>
      </section>

      <div className="mt-6 space-y-6">
        {stops?.map((stop, i) => {
          const city = cityById.get(stop.city_id);
          return (
            <section key={stop.stop_id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{i + 1}. {city?.name ?? "City"} <span className="text-sm font-normal text-zinc-500">{city?.country}</span></h2>
                <form action={deleteStop}>
                  <input type="hidden" name="trip_id" value={tripId} />
                  <input type="hidden" name="stop_id" value={stop.stop_id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">Remove</button>
                </form>
              </div>

              <form action={updateStop} className="mt-3 flex flex-wrap items-end gap-3 text-sm">
                <input type="hidden" name="trip_id" value={tripId} />
                <input type="hidden" name="stop_id" value={stop.stop_id} />
                <label className="flex flex-col gap-1">Start
                  <input type="date" name="start_date" defaultValue={stop.start_date ?? undefined} className="rounded border px-2 py-1" />
                </label>
                <label className="flex flex-col gap-1">End
                  <input type="date" name="end_date" defaultValue={stop.end_date ?? undefined} className="rounded border px-2 py-1" />
                </label>
                <label className="flex flex-col gap-1">Section budget (INR)
                  <input type="number" name="section_budget_inr" defaultValue={stop.section_budget_inr ?? undefined} className="rounded border px-2 py-1" />
                </label>
                <button type="submit" className="rounded bg-zinc-800 px-3 py-1 text-white">Save</button>
              </form>

              <h3 className="mt-4 text-sm font-semibold">Activities</h3>
              <form action={addTripActivity} className="mt-2 grid gap-2 sm:grid-cols-5">
                <input type="hidden" name="trip_id" value={tripId} />
                <input type="hidden" name="stop_id" value={stop.stop_id} />
                <select name="activity_id" className="rounded border px-2 py-1 text-sm sm:col-span-2">
                  <option value="">Custom activity…</option>
                  {allActivities?.map((a) => (
                    <option key={a.activity_id} value={a.activity_id}>{a.name}</option>
                  ))}
                </select>
                <input name="custom_name" placeholder="Custom name" className="rounded border px-2 py-1 text-sm" />
                <input type="number" name="day_number" placeholder="Day" defaultValue={1} className="rounded border px-2 py-1 text-sm" />
                <input type="number" name="planned_cost_inr" placeholder="Cost" className="rounded border px-2 py-1 text-sm" />
                <button type="submit" className="rounded bg-zinc-900 px-3 py-1 text-sm font-semibold text-white sm:col-span-2">Add activity</button>
              </form>

              <ul className="mt-3 space-y-2">
                {(byStop[stop.stop_id] ?? []).map((ta) => (
                  <li key={ta.trip_activity_id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">Day {ta.day_number}</span>
                      {ta.custom_name || (ta.activity_id ? activityById.get(ta.activity_id)?.name : null) || "Custom activity"}
                      {ta.planned_cost_inr ? <span className="text-zinc-500">· ₹{ta.planned_cost_inr}</span> : null}
                    </span>
                    <form action={deleteTripActivity}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="trip_activity_id" value={ta.trip_activity_id} />
                      <button type="submit" className="text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}