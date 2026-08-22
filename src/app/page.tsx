import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user, profile } = await requireActiveUser();
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_id,name,status,start_date,end_date,cover_photo_url,description")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(6);

  const { data: cities } = await supabase
    .from("cities")
    .select("city_id,name,country,popularity_score,cost_index,image_url,region")
    .order("popularity_score", { ascending: false })
    .limit(8);

  const upcoming = (trips ?? []).filter((t) => t.status === "upcoming" || t.status === "planning");
  const ongoing = (trips ?? []).filter((t) => t.status === "ongoing");
  const recent = (trips ?? []).filter((t) => t.status === "completed");

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Hero Welcome Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/50 to-transparent py-8 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">
              Travel Dashboard
            </span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {profile?.first_name || "Traveler"}!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Plan multi-city itineraries, manage expenses, and explore curated destination guides.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="btn-coral px-5 py-2.5 text-sm font-semibold shadow-md flex items-center gap-2"
          >
            <span>+</span> Plan a new trip
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
        {/* Ongoing Trips */}
        {ongoing.length > 0 ? (
          <section>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900">Ongoing Adventures</h2>
            </div>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ongoing.map((t) => (
                <Link
                  key={t.trip_id}
                  href={`/trips/${t.trip_id}`}
                  className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        ● Ongoing
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{t.start_date} – {t.end_date}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">{t.name}</h3>
                    {t.description ? <p className="mt-1 text-xs text-slate-600 line-clamp-2">{t.description}</p> : null}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs font-semibold text-[#0891B2] flex items-center justify-between">
                    <span>View Itinerary</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Upcoming Trips */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Trips</h2>
            <Link href="/trips" className="text-xs font-semibold text-[#0891B2] hover:underline">
              View all trips →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-teal-900/20 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No upcoming trips scheduled.</p>
              <Link href="/trips/new" className="mt-2 inline-block text-xs font-semibold text-[#FF5A5F] underline">
                Create a new itinerary now
              </Link>
            </div>
          ) : (
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((t) => (
                <Link
                  key={t.trip_id}
                  href={`/trips/${t.trip_id}`}
                  className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-[#0891B2] border border-sky-200 capitalize">
                        {t.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {t.start_date ? `${t.start_date} – ${t.end_date ?? ""}` : "Dates TBD"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">{t.name}</h3>
                    {t.description ? <p className="mt-1 text-xs text-slate-600 line-clamp-2">{t.description}</p> : null}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2.5 text-xs font-semibold text-[#0891B2] flex items-center justify-between">
                    <span>Manage Itinerary</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Past Trips */}
        {recent.length > 0 ? (
          <section>
            <h2 className="text-lg font-bold text-slate-900">Past Completed Trips</h2>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((t) => (
                <Link
                  key={t.trip_id}
                  href={`/trips/${t.trip_id}`}
                  className="pacific-card pacific-card-hover p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{t.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Completed
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{t.start_date} to {t.end_date}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Popular Destinations */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Popular Destinations</h2>
              <p className="text-xs text-slate-500">Top-rated cities to spark your next travel itinerary.</p>
            </div>
            <Link href="/cities" className="text-xs font-semibold text-[#0891B2] hover:underline">
              Explore all destinations →
            </Link>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cities?.map((c) => (
              <div
                key={c.city_id}
                className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">{c.region || "Global"}</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      ★ {c.popularity_score}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{c.country}</p>
                  {c.cost_index ? (
                    <p className="mt-2 text-[11px] text-slate-400">Cost Index: {c.cost_index}/100</p>
                  ) : null}
                </div>
                <div className="border-t border-slate-100 p-3 bg-slate-50/50 flex items-center justify-between">
                  <Link
                    href={`/activities?city_id=${c.city_id}`}
                    className="text-xs font-semibold text-[#0891B2] hover:underline"
                  >
                    Activities
                  </Link>
                  <Link
                    href={`/trips/new?city_id=${c.city_id}`}
                    className="rounded bg-[#FF5A5F] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#E0484D]"
                  >
                    Plan Here
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}