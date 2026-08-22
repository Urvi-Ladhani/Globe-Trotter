import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user, profile } = await requireActiveUser();
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_id,name,status,start_date,end_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(6);
  const { data: cities } = await supabase
    .from("cities")
    .select("city_id,name,country,popularity_score,cost_index")
    .order("popularity_score", { ascending: false })
    .limit(8);
  const upcoming = (trips ?? []).filter((t) => t.status === "upcoming");
  const recent = (trips ?? []).filter((t) => t.status !== "upcoming");

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Welcome back, {profile?.first_name ?? "traveler"}!</h1>
          <Link href="/trips/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Plan a new trip</Link>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Upcoming trips</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No upcoming trips. <Link className="underline" href="/trips/new">Create one</Link></p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((t) => (
                <Link key={t.trip_id} href={`/trips/${t.trip_id}`} className="rounded-lg border bg-white p-4">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{t.start_date} – {t.end_date}</p>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-700">{t.status}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Recent trips</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <Link key={t.trip_id} href={`/trips/${t.trip_id}`} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm capitalize text-zinc-500">{t.status}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Popular destinations</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cities?.map((c) => (
              <div key={c.city_id} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{c.country} · Pop {c.popularity_score} · Cost {c.cost_index ?? "—"}</p>
                <Link href={`/cities`} className="mt-2 block text-sm text-blue-600 underline">Explore</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}