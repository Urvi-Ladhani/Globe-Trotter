import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const { supabase, user } = await requireUser();
  const { data: trips } = await supabase.from("trips").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const groups: Record<string, typeof trips> = {};
  for (const t of trips ?? []) (groups[t.status] ??= []).push(t);
  const order = ["upcoming", "ongoing", "completed"];
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Trips</h1>
        <Link href="/trips/new" className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">+ New Trip</Link>
      </div>
      {order.map((s) => {
        const list = groups[s] ?? [];
        if (!list.length) return null;
        return (
          <section key={s} className="mt-8">
            <h2 className="text-lg font-semibold capitalize">{s}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <div key={t.trip_id} className="rounded-lg border bg-white p-4">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{t.start_date ?? "Open"} – {t.end_date ?? "Open"}</p>
                  <div className="mt-3 flex gap-2 text-sm">
                    <Link href={`/trips/${t.trip_id}`} className="text-blue-600 underline">View</Link>
                    <Link href={`/trips/${t.trip_id}/build`} className="text-blue-600 underline">Build</Link>
                    <Link href={`/trips/${t.trip_id}/budget`} className="text-blue-600 underline">Budget</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {!trips?.length ? <p className="mt-8 text-sm text-zinc-500">No trips yet. <Link href="/trips/new" className="underline">Plan your first trip</Link></p> : null}
    </main>
  );
}