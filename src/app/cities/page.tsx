import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { saveDestination, removeSavedDestination } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; region?: string; sort?: string }>;
}) {
  const { search, region, sort } = await searchParams;
  const { supabase, user, profile } = await requireActiveUser();

  // 1. Build query
  let query = supabase.from("cities").select("*");

  if (search) {
    query = query.or(`name.ilike.%${search}%,country.ilike.%${search}%`);
  }
  if (region) {
    query = query.eq("region", region);
  }

  if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "cost_asc") {
    query = query.order("cost_index", { ascending: true, nullsFirst: false });
  } else if (sort === "cost_desc") {
    query = query.order("cost_index", { ascending: false, nullsFirst: false });
  } else {
    // Default: popularity
    query = query.order("popularity_score", { ascending: false });
  }

  const { data: cities } = await query;

  // 2. Fetch distinct regions for filter dropdown
  const { data: regionData } = await supabase.from("cities").select("region");
  const regions = Array.from(
    new Set(regionData?.map((r) => r.region).filter(Boolean))
  ).sort() as string[];

  // 3. Fetch user's saved destinations
  const { data: savedDestinations } = await supabase
    .from("saved_destinations")
    .select("saved_id, city_id")
    .eq("user_id", user.id);

  const savedMap = new Map((savedDestinations ?? []).map((s) => [s.city_id, s.saved_id]));

  // 4. Fetch user's upcoming trips for quick "Add to Trip" button
  const { data: userTrips } = await supabase
    .from("trips")
    .select("trip_id, name, status")
    .eq("user_id", user.id)
    .in("status", ["upcoming", "planning", "ongoing"]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">Destination Catalog</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Explore Destinations</h1>
          <p className="mt-1 text-sm text-slate-600">Discover cities, check cost indices, and bookmark spots for upcoming itineraries.</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
        {/* Search & Filter Bar */}
        <section className="pacific-card p-5">
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search city or country..."
              className="pacific-input text-xs"
            />

            <select name="region" defaultValue={region ?? ""} className="pacific-input text-xs">
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select name="sort" defaultValue={sort ?? "popularity"} className="pacific-input text-xs">
              <option value="popularity">Sort by Popularity</option>
              <option value="name">Sort by Name (A–Z)</option>
              <option value="cost_asc">Cost Index (Lowest first)</option>
              <option value="cost_desc">Cost Index (Highest first)</option>
            </select>

            <button
              type="submit"
              className="btn-coral py-2 text-xs font-bold shadow-xs"
            >
              Filter Destinations
            </button>
          </form>
        </section>

        {/* Cities Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(cities ?? []).map((c) => {
            const isSaved = savedMap.has(c.city_id);
            const savedId = savedMap.get(c.city_id);

            return (
              <div
                key={c.city_id}
                className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0891B2]">{c.region || "Global"}</span>
                      <h2 className="text-xl font-bold text-slate-900">{c.name}</h2>
                      <p className="text-xs text-slate-500 font-medium">{c.country}</p>
                    </div>

                    {/* Bookmark Toggle */}
                    {isSaved && savedId ? (
                      <form action={unbookmarkCity}>
                        <input type="hidden" name="saved_id" value={savedId} />
                        <button
                          type="submit"
                          title="Remove bookmark"
                          className="rounded-full bg-rose-50 p-2 text-[#FF5A5F] hover:bg-rose-100 transition-colors"
                        >
                          ♥
                        </button>
                      </form>
                    ) : (
                      <form action={bookmarkCity}>
                        <input type="hidden" name="city_id" value={c.city_id} />
                        <button
                          type="submit"
                          title="Bookmark destination"
                          className="rounded-full bg-slate-100 p-2 text-slate-400 hover:text-[#FF5A5F] hover:bg-rose-50 transition-colors"
                        >
                          ♡
                        </button>
                      </form>
                    )}
                  </div>

                  {c.description ? (
                    <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">{c.description}</p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-amber-800 font-bold">
                      ★ Popularity: {c.popularity_score}
                    </span>
                    {c.cost_index ? (
                      <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[#0891B2] font-semibold">
                        Cost Index: {c.cost_index}/100
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 p-4 flex items-center justify-between text-xs">
                  <Link
                    href={`/activities?city_id=${c.city_id}`}
                    className="font-bold text-[#0891B2] hover:underline"
                  >
                    View Activities →
                  </Link>

                  <Link
                    href={`/trips/new?city_id=${c.city_id}`}
                    className="rounded-lg bg-[#0B4F6C] px-3 py-1.5 font-bold text-white shadow-xs hover:bg-[#0E6C8F]"
                  >
                    + Add to Trip
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {(cities ?? []).length === 0 ? (
          <p className="pacific-card p-12 text-center text-sm text-slate-500">
            No destinations found matching your query.
          </p>
        ) : null}
      </main>
    </div>
  );
}
