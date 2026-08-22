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

  // Fetch all cities for dropdown
  const { data: allCities } = await supabase
    .from("cities")
    .select("city_id, name, country, region")
    .order("name", { ascending: true });
  const cityById = new Map((allCities ?? []).map((c) => [c.city_id, c]));

  // Fetch activities for stop cities
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

  // Fetch trip activities for stops
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
    if (!byStop[ta.stop_id]) byStop[ta.stop_id] = [];
    byStop[ta.stop_id].push(ta);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-6 px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/trips/${tripId}`} className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
              ← Back to Itinerary View
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Itinerary Builder: <span className="text-[#0891B2]">{trip.name}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Add destination stops, dates, section budgets, and activities.</p>
          </div>
          <Link
            href={`/trips/${tripId}`}
            className="btn-coral px-5 py-2.5 text-xs font-bold shadow-md"
          >
            ✓ Done Editing
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}

        {/* Add Stop Section */}
        <section className="pacific-card p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2] text-xs text-white font-bold">
              +
            </span>
            <h2 className="text-base font-bold text-slate-900">Add Destination / Section</h2>
          </div>

          <form action={addStop} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs font-semibold text-slate-700">
            <input type="hidden" name="trip_id" value={tripId} />
            <select name="city_id" required className="pacific-input lg:col-span-2 text-xs">
              <option value="">Select a Destination City...</option>
              {allCities?.map((c) => (
                <option key={c.city_id} value={c.city_id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1">Start Date
              <input type="date" name="start_date" className="pacific-input text-xs" />
            </label>
            <label className="flex flex-col gap-1">End Date
              <input type="date" name="end_date" className="pacific-input text-xs" />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="btn-coral w-full py-2 text-xs font-bold shadow-xs"
              >
                + Add Section
              </button>
            </div>
          </form>
        </section>

        {/* Stops List */}
        <div className="space-y-6">
          {(stops ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-teal-900/20 bg-white p-10 text-center">
              <p className="text-sm text-slate-500 font-medium">No stops added to this trip yet.</p>
              <p className="text-xs text-slate-400 mt-1">Use the form above to add your first destination section.</p>
            </div>
          ) : (
            (stops ?? []).map((stop, i) => {
              const city = cityById.get(stop.city_id);
              const stopActs = byStop[stop.stop_id] ?? [];
              const availableCatalogActivities = activitiesByCity[stop.city_id] ?? [];

              return (
                <section key={stop.stop_id} className="pacific-card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 bg-slate-50/70 p-5">
                    <div>
                      <span className="text-[10px] font-bold text-[#0891B2] uppercase tracking-wider">STOP #{i + 1}</span>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {city?.name ?? "City"}, {city?.country}
                      </h2>
                    </div>
                    <form action={deleteStop}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="stop_id" value={stop.stop_id} />
                      <button type="submit" className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline">
                        Remove Section
                      </button>
                    </form>
                  </div>

                  {/* Stop Settings Form */}
                  <form action={updateStop} className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold text-slate-700">
                    <input type="hidden" name="trip_id" value={tripId} />
                    <input type="hidden" name="stop_id" value={stop.stop_id} />
                    <label className="flex flex-col gap-1">Start Date
                      <input
                        type="date"
                        name="start_date"
                        defaultValue={stop.start_date ?? undefined}
                        className="pacific-input text-xs"
                      />
                    </label>
                    <label className="flex flex-col gap-1">End Date
                      <input
                        type="date"
                        name="end_date"
                        defaultValue={stop.end_date ?? undefined}
                        className="pacific-input text-xs"
                      />
                    </label>
                    <label className="flex flex-col gap-1">Section Budget (INR)
                      <input
                        type="number"
                        name="section_budget_inr"
                        placeholder="e.g. 50000"
                        defaultValue={stop.section_budget_inr ?? undefined}
                        className="pacific-input text-xs"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="btn-teal w-full py-2 text-xs font-bold"
                      >
                        Save Section Info
                      </button>
                    </div>
                    <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">Notes
                      <input
                        name="notes"
                        placeholder="Hotel details, transport notes, etc."
                        defaultValue={stop.notes ?? ""}
                        className="pacific-input text-xs font-normal"
                      />
                    </label>
                  </form>

                  {/* Activities Subsection */}
                  <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Activities in {city?.name}
                    </h3>

                    {/* Form to add an activity */}
                    <form action={addTripActivity} className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6 rounded-lg bg-white p-3.5 border border-slate-200 shadow-xs">
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="stop_id" value={stop.stop_id} />
                      
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 font-bold mb-1">Catalog Activity</label>
                        <select name="activity_id" className="pacific-input w-full text-xs">
                          <option value="">-- Or Custom Activity Below --</option>
                          {availableCatalogActivities.map((a) => (
                            <option key={a.activity_id} value={a.activity_id}>
                              {a.name} ({a.category}{a.cost_estimate_inr ? ` · ₹${a.cost_estimate_inr}` : ""})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 font-bold mb-1">Custom Activity Name</label>
                        <input name="custom_name" placeholder="Custom activity name" className="pacific-input w-full text-xs" />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-1">Day #</label>
                        <input type="number" name="day_number" defaultValue={1} min={1} className="pacific-input w-full text-xs" />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 font-bold mb-1">Cost (INR)</label>
                        <input type="number" name="planned_cost_inr" placeholder="₹" className="pacific-input w-full text-xs" />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 font-bold mb-1">Time (e.g. 10:00 AM)</label>
                        <input name="scheduled_time" placeholder="10:00 AM" className="pacific-input w-full text-xs" />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-slate-500 font-bold mb-1">Notes</label>
                        <input name="notes" placeholder="Reservation info, tips..." className="pacific-input w-full text-xs" />
                      </div>

                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="submit"
                          className="btn-coral w-full py-2 text-xs font-bold shadow-xs"
                        >
                          + Add
                        </button>
                      </div>
                    </form>

                    {/* Existing Activities */}
                    <div className="mt-3 space-y-2">
                      {stopActs.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No activities added to this stop yet.</p>
                      ) : (
                        stopActs.map((ta) => {
                          const catalogAct = ta.activity_id ? activityById.get(ta.activity_id) : null;
                          const name = ta.custom_name || catalogAct?.name || "Activity";
                          return (
                            <div
                              key={ta.trip_activity_id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="rounded bg-sky-50 px-2 py-0.5 font-bold text-[#0891B2] border border-sky-200">
                                  Day {ta.day_number}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900">{name}</p>
                                  <p className="text-slate-500 text-[11px]">
                                    {catalogAct?.category ?? "Custom"}
                                    {ta.scheduled_time ? ` · ⏰ ${ta.scheduled_time}` : ""}
                                    {ta.planned_cost_inr ? ` · ₹${ta.planned_cost_inr.toLocaleString("en-IN")}` : ""}
                                    {ta.notes ? ` · Note: ${ta.notes}` : ""}
                                  </p>
                                </div>
                              </div>
                              <form action={deleteTripActivity}>
                                <input type="hidden" name="trip_id" value={tripId} />
                                <input type="hidden" name="trip_activity_id" value={ta.trip_activity_id} />
                                <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
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