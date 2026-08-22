import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { addStop, updateStop, deleteStop, addTripActivity, deleteTripActivity } from "@/lib/actions/trips";
import { DateRangePicker } from "@/components/date-range-picker";
import { Clock, Plus, Trash2, ArrowLeft, Calendar, MapPin, Sparkles } from "lucide-react";

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
        .order("order_index", { ascending: true })
    : { data: [] };

  const byStop: Record<string, typeof tripActivities> = {};
  for (const ta of tripActivities ?? []) {
    (byStop[ta.stop_id] ??= []).push(ta);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/50 to-transparent py-6 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/trips/${tripId}`}
              className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1 mb-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Itinerary Builder</h1>
            <p className="mt-1 text-xs text-slate-600">
              Trip: <span className="font-bold text-slate-800">{trip.name}</span>
            </p>
          </div>
          <Link
            href={`/trips/${tripId}`}
            className="btn-teal px-4 py-2 text-xs font-bold shadow-xs"
          >
            Done Editing →
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}

        {/* Add Stop Section */}
        <section className="pacific-card p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2] text-xs text-white font-bold">
              <Plus className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-base font-bold text-slate-900">Add Destination / Section</h2>
          </div>

          <form action={addStop} className="mt-4 flex flex-col gap-4 text-xs font-semibold text-slate-700">
            <input type="hidden" name="trip_id" value={tripId} />
            
            <label className="flex flex-col gap-1">
              Destination City *
              <select name="city_id" required className="pacific-input text-xs">
                <option value="">Select a Destination City...</option>
                {allCities?.map((c) => (
                  <option key={c.city_id} value={c.city_id}>
                    {c.name}, {c.country} ({c.region || "Global"})
                  </option>
                ))}
              </select>
            </label>

            {/* MakeMyTrip Style Date Range Picker */}
            <DateRangePicker
              label="Section Stay Dates (Arrival & Departure)"
              startName="start_date"
              endName="end_date"
              defaultStartDate={trip.start_date ?? undefined}
              defaultEndDate={trip.end_date ?? undefined}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-coral px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Section to Trip</span>
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
                      <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-4 w-4 text-[#0891B2]" />
                        <span>{city?.name ?? "City"}, {city?.country}</span>
                      </h2>
                    </div>
                    <form action={deleteStop}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="stop_id" value={stop.stop_id} />
                      <button type="submit" className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Section</span>
                      </button>
                    </form>
                  </div>

                  {/* Stop Settings Form */}
                  <form action={updateStop} className="p-5 flex flex-col gap-4 text-xs font-semibold text-slate-700">
                    <input type="hidden" name="trip_id" value={tripId} />
                    <input type="hidden" name="stop_id" value={stop.stop_id} />

                    <DateRangePicker
                      label="Stay Dates"
                      startName="start_date"
                      endName="end_date"
                      defaultStartDate={stop.start_date}
                      defaultEndDate={stop.end_date}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1">Section Budget (INR)
                        <input
                          type="number"
                          name="section_budget_inr"
                          placeholder="e.g. 50000"
                          defaultValue={stop.section_budget_inr ?? undefined}
                          className="pacific-input text-xs"
                        />
                      </label>
                      <label className="flex flex-col gap-1">Notes
                        <input
                          name="notes"
                          placeholder="Hotel details, transport notes, etc."
                          defaultValue={stop.notes ?? ""}
                          className="pacific-input text-xs font-normal"
                        />
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn-teal px-4 py-2 text-xs font-bold shadow-xs"
                      >
                        Save Section Info
                      </button>
                    </div>
                  </form>

                  {/* Activities Subsection */}
                  <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Activities in {city?.name}
                    </h3>

                    {/* Existing Activities */}
                    {stopActs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1">No activities scheduled yet for this stop.</p>
                    ) : (
                      <div className="space-y-2">
                        {stopActs.map((ta) => {
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
                                    {ta.scheduled_time ? (
                                      <span className="inline-flex items-center gap-0.5">
                                        {" "}· <Clock className="h-3 w-3 inline text-slate-400" /> {ta.scheduled_time}
                                      </span>
                                    ) : ""}
                                    {ta.planned_cost_inr ? ` · ₹${ta.planned_cost_inr.toLocaleString("en-IN")}` : ""}
                                    {ta.notes ? ` · Note: ${ta.notes}` : ""}
                                  </p>
                                </div>
                              </div>
                              <form action={deleteTripActivity}>
                                <input type="hidden" name="trip_id" value={tripId} />
                                <input type="hidden" name="trip_activity_id" value={ta.trip_activity_id} />
                                <button type="submit" className="text-xs font-semibold text-red-500 hover:underline" title="Delete activity">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </form>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Activity Forms */}
                    <div className="mt-5 grid gap-4 pt-4 border-t border-slate-200 sm:grid-cols-2">
                      {/* Pick from Catalog */}
                      {availableCatalogActivities.length > 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1 mb-2">
                            <Sparkles className="h-3.5 w-3.5 text-[#0891B2]" />
                            <span>Add from Catalog</span>
                          </h4>
                          <form action={addTripActivity} className="flex flex-col gap-2">
                            <input type="hidden" name="trip_id" value={tripId} />
                            <input type="hidden" name="stop_id" value={stop.stop_id} />
                            <select name="activity_id" required className="pacific-input text-xs py-1.5">
                              <option value="">Choose activity...</option>
                              {availableCatalogActivities.map((a) => (
                                <option key={a.activity_id} value={a.activity_id}>
                                  {a.name} ({a.category})
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                name="day_number"
                                defaultValue={1}
                                min={1}
                                title="Day Number"
                                placeholder="Day"
                                className="pacific-input w-16 text-center text-xs py-1.5"
                              />
                              <input
                                type="time"
                                name="scheduled_time"
                                className="pacific-input flex-1 text-xs py-1.5"
                              />
                            </div>
                            <button
                              type="submit"
                              className="btn-coral py-1.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1 mt-1"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Add Catalog Activity</span>
                            </button>
                          </form>
                        </div>
                      ) : null}

                      {/* Custom Activity */}
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1 mb-2">
                          <Plus className="h-3.5 w-3.5 text-[#FF5A5F]" />
                          <span>Custom Activity</span>
                        </h4>
                        <form action={addTripActivity} className="flex flex-col gap-2">
                          <input type="hidden" name="trip_id" value={tripId} />
                          <input type="hidden" name="stop_id" value={stop.stop_id} />
                          <input
                            name="custom_name"
                            required
                            placeholder="e.g. Dinner at Seaside Bistro"
                            className="pacific-input text-xs py-1.5"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              name="day_number"
                              defaultValue={1}
                              min={1}
                              placeholder="Day #"
                              className="pacific-input text-xs py-1.5"
                            />
                            <input
                              type="number"
                              name="planned_cost_inr"
                              placeholder="Cost (INR)"
                              className="pacific-input text-xs py-1.5"
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn-teal py-1.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1 mt-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Custom Activity</span>
                          </button>
                        </form>
                      </div>
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