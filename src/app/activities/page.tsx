import Link from "next/link";
import { requireActiveUser, ACTIVITY_CATEGORIES } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";
import { submitActivity, addActivityToTripStop } from "@/lib/actions/activities";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    city_id?: string;
    category?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const { supabase, profile, user } = await requireActiveUser();
  const { search, city_id, category, error, success } = await searchParams;

  // 1. Fetch cities for filter and submit modal
  const { data: allCities } = await supabase
    .from("cities")
    .select("city_id, name, country")
    .order("name");
  const cityMap = new Map((allCities ?? []).map((c) => [c.city_id, c]));

  // 2. Query approved activities
  let query = supabase.from("activities").select("*").eq("is_approved", true);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (city_id && city_id !== "all") {
    query = query.eq("city_id", city_id);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data: activities } = await query.order("name").limit(60);

  // 3. Fetch user's trips and stops to allow adding activities to a stop
  const { data: userTrips } = await supabase
    .from("trips")
    .select("trip_id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const userTripIds = (userTrips ?? []).map((t) => t.trip_id);
  const { data: userStops } = userTripIds.length
    ? await supabase
        .from("trip_stops")
        .select("stop_id, trip_id, city_id, start_date, end_date")
        .in("trip_id", userTripIds)
        .order("order_index")
    : { data: [] };

  const tripMap = new Map((userTrips ?? []).map((t) => [t.trip_id, t]));

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Explore Activities</h1>
            <p className="text-sm text-zinc-500">Discover things to do across destinations and add them to your itinerary.</p>
          </div>
          <a
            href="#submit-activity"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + Submit New Activity
          </a>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

        {/* Filters */}
        <form method="GET" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search activities..."
            className="min-w-[180px] flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <select
            name="city_id"
            defaultValue={city_id ?? "all"}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">All Cities</option>
            {allCities?.map((c) => (
              <option key={c.city_id} value={c.city_id}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category ?? "all"}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {ACTIVITY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Filter
          </button>
          {(search || (city_id && city_id !== "all") || (category && category !== "all")) ? (
            <Link href="/activities" className="text-sm text-zinc-500 hover:underline">
              Clear
            </Link>
          ) : null}
        </form>

        {/* Activities Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(activities ?? []).map((act) => {
            const city = cityMap.get(act.city_id);

            return (
              <div key={act.activity_id} className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                      {act.category}
                    </span>
                    {act.rating ? (
                      <span className="text-xs font-bold text-amber-600">★ {act.rating.toFixed(1)}</span>
                    ) : null}
                  </div>

                  <h2 className="mt-2 text-lg font-bold">{act.name}</h2>
                  <p className="text-xs text-zinc-500">
                    {city?.name ?? "City"}, {city?.country}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                    {act.duration_minutes ? (
                      <span className="rounded bg-zinc-50 border px-1.5 py-0.5">⏱ {act.duration_minutes} min</span>
                    ) : null}
                    {act.cost_estimate_inr !== null ? (
                      <span className="rounded bg-zinc-50 border px-1.5 py-0.5 font-medium text-zinc-800">
                        ₹{act.cost_estimate_inr.toLocaleString("en-IN")}
                      </span>
                    ) : null}
                  </div>

                  {act.description ? (
                    <p className="mt-3 text-xs text-zinc-600 line-clamp-3">{act.description}</p>
                  ) : null}
                </div>

                {/* Add to Trip Section Form */}
                <div className="mt-5 border-t pt-4">
                  {(userStops ?? []).length > 0 ? (
                    <form action={addActivityToTripStop} className="flex flex-col gap-2 text-xs">
                      <input type="hidden" name="activity_id" value={act.activity_id} />
                      <input type="hidden" name="return_url" value="/activities" />
                      <input type="hidden" name="planned_cost_inr" value={act.cost_estimate_inr ?? 0} />
                      <label className="text-zinc-500 font-medium">Add to your trip stop:</label>
                      <div className="flex gap-2">
                        <select name="stop_id" required className="flex-1 rounded border px-2 py-1.5 text-xs text-zinc-800">
                          <option value="">Select a stop...</option>
                          {userStops?.map((s) => {
                            const trip = tripMap.get(s.trip_id);
                            const stopCity = cityMap.get(s.city_id);
                            return (
                              <option key={s.stop_id} value={s.stop_id}>
                                {trip?.name} — {stopCity?.name}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="number"
                          name="day_number"
                          defaultValue={1}
                          min={1}
                          title="Day #"
                          placeholder="Day"
                          className="w-14 rounded border px-2 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded bg-zinc-900 px-3 py-1.5 font-semibold text-white hover:bg-zinc-700"
                        >
                          + Add
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-xs text-zinc-400">Create a trip and stop to add this activity.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(activities ?? []).length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-500">No activities found matching your criteria.</p>
        ) : null}

        {/* Submit New Activity Section */}
        <section id="submit-activity" className="mt-16 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Submit a New Activity</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Know a great spot or experience? Submit it to the catalog. It will be added after admin review.
          </p>

          <form action={submitActivity} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Activity Name *
              <input name="name" required placeholder="e.g. Sunset Kayaking Tour" className="rounded-lg border px-3 py-2 text-sm" />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              City *
              <select name="city_id" required className="rounded-lg border px-3 py-2 text-sm">
                <option value="">Select city...</option>
                {allCities?.map((c) => (
                  <option key={c.city_id} value={c.city_id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Category *
              <select name="category" required className="rounded-lg border px-3 py-2 text-sm">
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Cost Estimate (INR)
              <input type="number" name="cost_estimate_inr" placeholder="e.g. 1200" className="rounded-lg border px-3 py-2 text-sm" />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              Duration (Minutes)
              <input type="number" name="duration_minutes" placeholder="e.g. 120" className="rounded-lg border px-3 py-2 text-sm" />
            </label>

            <div className="sm:col-span-2">
              <ImageUploadInput
                name="image_url"
                label="Activity Photo"
                folder="activities"
                placeholder="https://..."
              />
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
              Description
              <textarea name="description" rows={3} placeholder="Highlights, tips, booking advice..." className="rounded-lg border px-3 py-2 text-sm" />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                Submit Activity for Approval
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
