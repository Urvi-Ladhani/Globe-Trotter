import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { saveDestination, removeSavedDestination } from "@/lib/actions/profile";
import { addStop } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; region?: string; error?: string; success?: string }>;
}) {
  const { supabase, user, profile } = await requireActiveUser();
  const { search, region, error, success } = await searchParams;

  // Build query for cities
  let query = supabase.from("cities").select("*");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (region && region !== "all") {
    query = query.eq("region", region);
  }

  const { data: cities } = await query.order("popularity_score", { ascending: false }).limit(60);

  // Fetch unique regions for filter
  const { data: allRegionsData } = await supabase
    .from("cities")
    .select("region")
    .not("region", "is", null);
  const regions = Array.from(new Set(allRegionsData?.map((r) => r.region).filter(Boolean) as string[])).sort();

  // Fetch user's saved destinations
  const { data: savedList } = await supabase
    .from("saved_destinations")
    .select("saved_id, city_id")
    .eq("user_id", user.id);
  const savedCityMap = new Map((savedList ?? []).map((s) => [s.city_id, s.saved_id]));

  // Fetch user's active/upcoming trips for quick "Add to Trip"
  const { data: userTrips } = await supabase
    .from("trips")
    .select("trip_id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Explore Destinations</h1>
            <p className="text-sm text-zinc-500">Discover cities around the world, save favorites, and add them to your trips.</p>
          </div>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + Create New Trip
          </Link>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

        {/* Search & Filter Bar */}
        <form method="GET" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by city name..."
            className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <select
            name="region"
            defaultValue={region ?? "all"}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Filter
          </button>
          {(search || (region && region !== "all")) ? (
            <Link href="/cities" className="text-sm text-zinc-500 hover:underline">
              Clear
            </Link>
          ) : null}
        </form>

        {/* Cities Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(cities ?? []).map((city) => {
            const isSaved = savedCityMap.has(city.city_id);
            const savedId = savedCityMap.get(city.city_id);

            return (
              <div key={city.city_id} className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold">{city.name}</h2>
                      <p className="text-sm text-zinc-500">
                        {city.country} {city.region ? `· ${city.region}` : ""}
                      </p>
                    </div>
                    {/* Bookmark / Save Button */}
                    {isSaved ? (
                      <form action={removeSavedDestination}>
                        <input type="hidden" name="saved_id" value={savedId} />
                        <button
                          type="submit"
                          title="Remove from saved"
                          className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          ★ Saved
                        </button>
                      </form>
                    ) : (
                      <form action={saveDestination}>
                        <input type="hidden" name="city_id" value={city.city_id} />
                        <input type="hidden" name="return_url" value="/cities" />
                        <button
                          type="submit"
                          title="Save destination"
                          className="rounded-full border px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                        >
                          ☆ Save
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                      Popularity: {city.popularity_score}
                    </span>
                    {city.cost_index ? (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
                        Cost Index: {city.cost_index}/100
                      </span>
                    ) : null}
                  </div>

                  {city.description ? (
                    <p className="mt-3 text-xs text-zinc-600 line-clamp-3">{city.description}</p>
                  ) : null}
                </div>

                <div className="mt-5 border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href={`/activities?city_id=${city.city_id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      View Activities →
                    </Link>
                  </div>

                  {/* Add to an existing trip */}
                  {(userTrips ?? []).length > 0 ? (
                    <form action={addStop} className="flex items-center gap-2 text-xs">
                      <input type="hidden" name="city_id" value={city.city_id} />
                      <input type="hidden" name="return_url" value="/cities" />
                      <select name="trip_id" required className="flex-1 rounded border px-2 py-1.5 text-xs text-zinc-800">
                        <option value="">+ Add to trip...</option>
                        {userTrips?.map((t) => (
                          <option key={t.trip_id} value={t.trip_id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded bg-zinc-900 px-2.5 py-1.5 font-semibold text-white hover:bg-zinc-700"
                      >
                        Add
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/trips/new?city_id=${city.city_id}`}
                      className="block text-center rounded border bg-zinc-50 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      Start a trip here
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(cities ?? []).length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-500">No destinations found matching your criteria.</p>
        ) : null}
      </main>
    </div>
  );
}
