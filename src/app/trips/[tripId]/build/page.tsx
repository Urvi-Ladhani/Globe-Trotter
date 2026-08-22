import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
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
  const { supabase, profile } = await requireActiveUser();

  const { data: trip } = await supabase.from("trips").select("*").eq("trip_id", tripId).maybeSingle();
  if (!trip) notFound();

  // Fetch stops
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });

  // Fetch all cities for the add-stop dropdown
  const { data: allCities } = await supabase
    .from("cities")
    .select("city_id, name, country, region")
    .order("name", { ascending: true });
  const cityById = new Map((allCities ?? []).map((c) => [c.city_id, c]));

  // Fetch activities for all stop cities
  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cityActivities } = stopCityIds.length
    ? await supabase
        .from("activities")
        .select("activity_id, city_id, name, category, cost_estimate_inr, duration_minutes")
        .in("city_id", stopCityIds)
        .eq("is_approved", true)
        .order("name", { ascending: true })
    : { data: [] };

  const activitiesByCity: Record<string, typeof cityActivities> = {};
  for (const a of cityActivities ?? []) {
    (activitiesByCity[a.city_id] ??= []).push(a);
  }

  const activityById = new Map((cityActivities ?? []).map((a) => [a.activity_id, a]));

  // Fetch trip activities for these stops
  const stopIds = (stops ?? []).map((s) => s.stop_id);
  const { data: tripActivities } = stopIds.length
    ? await supabase
        .from("trip_activities")
        .select("*")
        .in("stop_id", stopIds)
        .order("day_number", { ascending: true })
    : { data: [] };

  type TripActivityRow = NonNullable<typeof tripActivities>[number];
  const byStop: Record<string, TripActivityRow[]> = {};
  for (const ta of (tripActivities ?? []) as TripActivityRow[]) {
    (byStop[ta.stop_id] ??= []).push(ta);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/trips/${tripId}`} className="text-sm text-blue-600 hover:underline">
                ← Back to Itinerary
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-bold">Itinerary Builder: {trip.name}</h1>
            <p className="text-sm text-zinc-500">Add destinations (stops), schedule dates, and organize activities.</p>
          </div>
          <Link
            href={`/trips/${tripId}`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Done Editing
          </Link>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        {/* Add Stop Section */}
        <section className="mt-6 rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Add a Destination / Section</h2>
          <form action={addStop} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input type="hidden" name="trip_id" value={tripId} />
            <select name="city_id" required className="rounded-lg border px-3 py-2 text-sm lg:col-span-2">
              <option value="">Select a City...</option>
              {allCities?.map((c) => (
                <option key={c.city_id} value={c.city_id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
            <label className="flex flex-col text-xs text-zinc-500 font-medium">Start
              <input type="date" name="start_date" className="rounded-lg border px-3 py-1.5 text-sm text-zinc-900" />
            </label>
            <label className="flex flex-col text-xs text-zinc-500 font-medium">End
              <input type="date" name="end_date" className="rounded-lg border px-3 py-1.5 text-sm text-zinc-900" />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                + Add Section
              </button>
            </div>
          </form>
        </section>

        {/* Stops List */}
        <div className="mt-8 space-y-6">
          {(stops ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-zinc-500">
              No stops added yet. Use the form above to add your first destination.
            </div>
          ) : (
            (stops ?? []).map((stop, i) => {
              const city = cityById.get(stop.city_id);
              const stopActs = byStop[stop.stop_id] ?? [];
              const availableCatalogActivities = activitiesByCity[stop.city_id] ?? [];

              return (
                <section key={stop.stop_id} className="rounded-lg border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <span className="text-xs font-semibold text-zinc-400">STOP #{i + 1}</span>
                      <h2 className="text-lg font-bold">
                        {city?.name ?? "City"}, {city?.country}
                      </h2>
                    </div>
                    <form action={deleteStop}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="stop_id" value={stop.stop_id} />
                      <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                        Remove Section
                      </button>
                    </form>
                  </div>

                  {/* Stop Settings Form */}
                  <form action={updateStop} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-medium">
                    <input type="hidden" name="trip_id" value={tripId} />
                    <input type="hidden" name="stop_id" value={stop.stop_id} />
                    <label className="flex flex-col gap-1">Start Date
                      <input
                        type="date"
                        name="start_date"
                        defaultValue={stop.start_date ?? undefined}
                        className="rounded border px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1">End Date
                      <input
                        type="date"
                        name="end_date"
                        defaultValue={stop.end_date ?? undefined}
                        className="rounded border px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1">Section Budget (INR)
                      <input
                        type="number"
                        name="section_budget_inr"
                        placeholder="e.g. 50000"
                        defaultValue={stop.section_budget_inr ?? undefined}
                        className="rounded border px-2 py-1.5 text-sm"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                      >
                        Save Section Info
                      </button>
                    </div>
                    <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">Notes
                      <input
                        name="notes"
                        placeholder="Hotel details, notes, etc."
                        defaultValue={stop.notes ?? ""}
                        className="rounded border px-2 py-1.5 text-sm font-normal"
                      />
                    </label>
                  </form>

                  {/* Activity List & Add Activity Form */}
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-sm font-semibold">Activities in {city?.name}</h3>

                    {/* Form to add an activity */}
                    <form action={addTripActivity} className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6 rounded-md bg-zinc-50 p-3 border">
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="stop_id" value={stop.stop_id} />
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-500 font-medium mb-1">Catalog Activity</label>
                        <select name="activity_id" className="w-full rounded border px-2 py-1.5 text-xs">
                          <option value="">-- Or Custom Activity Below --</option>
                          {availableCatalogActivities.map((a) => (
                            <option key={a.activity_id} value={a.activity_id}>
                              {a.name} ({a.category}{a.cost_estimate_inr ? ` · ₹${a.cost_estimate_inr}` : ""})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-500 font-medium mb-1">Custom Activity Name</label>
                        <input name="custom_name" placeholder="Custom activity name" className="w-full rounded border px-2 py-1.5 text-xs" />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-500 font-medium mb-1">Day #</label>
                        <input type="number" name="day_number" defaultValue={1} min={1} className="w-full rounded border px-2 py-1.5 text-xs" />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-500 font-medium mb-1">Planned Cost (INR)</label>
                        <input type="number" name="planned_cost_inr" placeholder="₹" className="w-full rounded border px-2 py-1.5 text-xs" />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-zinc-500 font-medium mb-1">Time (e.g. 10:00 AM)</label>
                        <input name="scheduled_time" placeholder="10:00 AM" className="w-full rounded border px-2 py-1.5 text-xs" />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-zinc-500 font-medium mb-1">Notes</label>
                        <input name="notes" placeholder="Reservation info, tips..." className="w-full rounded border px-2 py-1.5 text-xs" />
                      </div>

                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="submit"
                          className="w-full rounded bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
                        >
                          + Add
                        </button>
                      </div>
                    </form>

                    {/* Existing Activities */}
                    <div className="mt-3 space-y-2">
                      {stopActs.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-2">No activities added to this stop yet.</p>
                      ) : (
                        stopActs.map((ta) => {
                          const catalogAct = ta.activity_id ? activityById.get(ta.activity_id) : null;
                          const name = ta.custom_name || catalogAct?.name || "Activity";
                          return (
                            <div
                              key={ta.trip_activity_id}
                              className="flex items-center justify-between rounded border bg-white p-2.5 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="rounded bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                                  Day {ta.day_number}
                                </span>
                                <div>
                                  <p className="font-semibold text-zinc-900">{name}</p>
                                  <p className="text-zinc-500">
                                    {catalogAct?.category ?? "Custom"}
                                    {ta.scheduled_time ? ` · ${ta.scheduled_time}` : ""}
                                    {ta.planned_cost_inr ? ` · ₹${ta.planned_cost_inr.toLocaleString("en-IN")}` : ""}
                                    {ta.notes ? ` · Note: ${ta.notes}` : ""}
                                  </p>
                                </div>
                              </div>
                              <form action={deleteTripActivity}>
                                <input type="hidden" name="trip_id" value={tripId} />
                                <input type="hidden" name="trip_activity_id" value={ta.trip_activity_id} />
                                <button type="submit" className="text-red-600 hover:underline">
                                  Delete
                                </button>
                              </form>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}