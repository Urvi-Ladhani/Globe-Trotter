import Link from "next/link";
import { requireActiveUser, ACTIVITY_CATEGORIES } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";
import { submitActivity, addActivityToTripStop } from "@/lib/actions/activities";
import { Star, MapPin, Clock, Search, SlidersHorizontal, Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ city_id?: string; category?: string; search?: string; error?: string; success?: string }>;
}) {
  const { city_id, category, search, error, success } = await searchParams;
  const { supabase, user, profile } = await requireActiveUser();

  // 1. Fetch approved activities based on filters
  let query = supabase.from("activities").select("*").eq("is_approved", true);
  if (city_id) query = query.eq("city_id", city_id);
  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data: activities } = await query.order("created_at", { ascending: false });

  // 2. Fetch all cities for filter dropdown and submit form
  const { data: allCities } = await supabase
    .from("cities")
    .select("city_id, name, country")
    .order("name", { ascending: true });

  const cityMap = new Map((allCities ?? []).map((c) => [c.city_id, c]));

  // 3. Fetch user's trips and stops to allow 1-click adding to itinerary
  const { data: userTrips } = await supabase
    .from("trips")
    .select("trip_id, name, status")
    .eq("user_id", user.id)
    .in("status", ["planning", "upcoming", "ongoing"]);

  const tripIds = (userTrips ?? []).map((t) => t.trip_id);
  const { data: userStops } = tripIds.length
    ? await supabase
        .from("trip_stops")
        .select("stop_id, trip_id, city_id, order_index")
        .in("trip_id", tripIds)
        .order("order_index", { ascending: true })
    : { data: [] };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-8 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">Experiences & Sights</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Activity Catalog</h1>
            <p className="mt-1 text-sm text-slate-600">Discover things to do, explore estimated costs, and schedule them into your trip stops.</p>
          </div>

          <a href="#submit-activity" className="btn-coral px-4 py-2 text-xs font-bold shadow-xs flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Submit New Activity</span>
          </a>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}
        {success ? <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">{success}</p> : null}

        {/* Filter Controls */}
        <section className="pacific-card p-4">
          <form className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search activities..."
                className="pacific-input w-full pl-9 text-xs"
              />
            </div>

            <select name="city_id" defaultValue={city_id ?? ""} className="pacific-input text-xs">
              <option value="">All Destinations</option>
              {allCities?.map((c) => (
                <option key={c.city_id} value={c.city_id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>

            <select name="category" defaultValue={category ?? ""} className="pacific-input text-xs">
              <option value="">All Categories</option>
              {ACTIVITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button type="submit" className="btn-teal py-2 text-xs font-bold shadow-xs flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Apply Filter</span>
            </button>
          </form>
        </section>

        {/* Activities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(activities ?? []).map((act) => {
            const city = cityMap.get(act.city_id);

            return (
              <div
                key={act.activity_id}
                className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-[#0891B2] border border-sky-200">
                      {act.category}
                    </span>
                    {act.rating ? (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{act.rating}</span>
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-slate-900">{act.name}</h2>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{city?.name ?? "City"}, {city?.country}</span>
                  </p>

                  {act.description ? (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">{act.description}</p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="font-extrabold text-slate-900">
                      {act.cost_estimate_inr ? `₹${act.cost_estimate_inr.toLocaleString("en-IN")}` : "Free / Varies"}
                    </span>
                    {act.duration_minutes ? (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{act.duration_minutes} mins</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Add to Trip Stop Form */}
                <div className="border-t border-slate-100 bg-slate-50/70 p-3.5">
                  {(userStops ?? []).length > 0 ? (
                    <form action={addActivityToTripStop} className="flex flex-col gap-2">
                      <input type="hidden" name="activity_id" value={act.activity_id} />
                      <div className="flex gap-2">
                        <select name="stop_id" required className="pacific-input flex-1 text-xs py-1.5">
                          <option value="">Select Stop...</option>
                          {userStops?.map((s) => {
                            const trip = (userTrips ?? []).find((t) => t.trip_id === s.trip_id);
                            const stopCity = cityMap.get(s.city_id);
                            return (
                              <option key={s.stop_id} value={s.stop_id}>
                                {trip?.name} ({stopCity?.name})
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="number"
                          name="day_number"
                          defaultValue={1}
                          min={1}
                          title="Day Number"
                          className="pacific-input w-16 text-center text-xs py-1.5"
                        />
                      </div>
                      <button type="submit" className="btn-coral py-1.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1">
                        <Plus className="h-3 w-3" />
                        <span>Add to Itinerary</span>
                      </button>
                    </form>
                  ) : (
                    <p className="text-[11px] text-slate-400">Create a trip and stop to add this activity.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(activities ?? []).length === 0 ? (
          <p className="pacific-card p-12 text-center text-sm text-slate-500">No activities found matching your criteria.</p>
        ) : null}

        {/* Submit New Activity Section */}
        <section id="submit-activity" className="pacific-card p-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#0891B2]" />
            <h2 className="text-xl font-bold text-slate-900">Submit a New Activity</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Know a great spot or experience? Submit it to the catalog. It will be added after admin review.
          </p>

          <form action={submitActivity} className="mt-6 grid gap-4 sm:grid-cols-2 text-xs font-semibold text-slate-700">
            <label className="flex flex-col gap-1">
              Activity Name *
              <input name="name" required placeholder="e.g. Sunset Kayaking Tour" className="pacific-input text-xs" />
            </label>

            <label className="flex flex-col gap-1">
              City *
              <select name="city_id" required className="pacific-input text-xs">
                <option value="">Select city...</option>
                {allCities?.map((c) => (
                  <option key={c.city_id} value={c.city_id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              Category *
              <select name="category" required className="pacific-input text-xs">
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              Cost Estimate (INR)
              <input type="number" name="cost_estimate_inr" placeholder="e.g. 1200" className="pacific-input text-xs" />
            </label>

            <label className="flex flex-col gap-1">
              Duration (Minutes)
              <input type="number" name="duration_minutes" placeholder="e.g. 120" className="pacific-input text-xs" />
            </label>

            <div className="sm:col-span-2">
              <ImageUploadInput
                name="image_url"
                label="Photo (optional)"
                folder="activities"
                placeholder="https://example.com/activity.jpg"
              />
            </div>

            <label className="flex flex-col gap-1 sm:col-span-2">
              Description
              <textarea name="description" rows={3} placeholder="Highlights, tips, best time of day to visit..." className="pacific-input text-xs font-normal" />
            </label>

            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-coral px-6 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Submit for Review</span>
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
