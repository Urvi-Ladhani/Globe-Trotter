import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { deleteTrip, respondToInvite } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const { supabase, user, profile } = await requireActiveUser();

  // 1. Fetch user's own trips
  const { data: ownTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  // 2. Fetch collaborator records for this user
  const { data: collaborations } = await supabase
    .from("trip_collaborators")
    .select("trip_id, permission, status")
    .eq("user_id", user.id);

  const pendingInvites = (collaborations ?? []).filter((c) => c.status === "pending");
  const acceptedCollabs = (collaborations ?? []).filter((c) => c.status === "accepted");

  // Fetch pending invite trip details
  const pendingTripIds = pendingInvites.map((c) => c.trip_id);
  const { data: pendingTripDetails } = pendingTripIds.length
    ? await supabase.from("trips").select("trip_id, name, start_date, end_date, user_id").in("trip_id", pendingTripIds)
    : { data: [] };
  const pendingTripMap = new Map((pendingTripDetails ?? []).map((t) => [t.trip_id, t]));

  // Fetch shared trips that user is accepted collaborator on
  const acceptedTripIds = acceptedCollabs.map((c) => c.trip_id);
  const { data: sharedTrips } = acceptedTripIds.length
    ? await supabase.from("trips").select("*").in("trip_id", acceptedTripIds)
    : { data: [] };

  const groups: Record<string, typeof ownTrips> = {
    ongoing: [],
    upcoming: [],
    completed: [],
  };

  for (const t of ownTrips ?? []) {
    const s = t.status === "planning" ? "upcoming" : t.status || "upcoming";
    (groups[s] ??= []).push(t);
  }

  const order = ["ongoing", "upcoming", "completed"];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-6 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">My Trips</h1>
            <p className="mt-1 text-sm text-slate-600">View and organize all your upcoming, ongoing, and past itineraries.</p>
          </div>
          <Link
            href="/trips/new"
            className="btn-coral px-5 py-2.5 text-sm font-semibold shadow-md flex items-center gap-1.5"
          >
            <span>+</span> Plan New Trip
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
        {/* Pending Invites */}
        {pendingInvites.length > 0 ? (
          <section className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
            <h2 className="text-base font-bold text-amber-900">Trip Collaboration Invites ({pendingInvites.length})</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {pendingInvites.map((inv) => {
                const t = pendingTripMap.get(inv.trip_id);
                return (
                  <div key={inv.trip_id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-4 shadow-xs">
                    <div>
                      <h3 className="font-bold text-slate-900">{t?.name ?? "Trip Invitation"}</h3>
                      <p className="text-xs text-slate-500">
                        {t?.start_date ?? "TBD"} – {t?.end_date ?? "TBD"} · Role: <span className="font-semibold text-slate-700 capitalize">{inv.permission}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={respondToInvite}>
                        <input type="hidden" name="trip_id" value={inv.trip_id} />
                        <input type="hidden" name="status" value="accepted" />
                        <button type="submit" className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Accept</button>
                      </form>
                      <form action={respondToInvite}>
                        <input type="hidden" name="trip_id" value={inv.trip_id} />
                        <input type="hidden" name="status" value="declined" />
                        <button type="submit" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Decline</button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* User's Trips by Status */}
        {order.map((s) => {
          const list = groups[s] ?? [];
          if (!list.length) return null;
          return (
            <section key={s}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  s === "ongoing" ? "bg-emerald-500 animate-pulse" : s === "upcoming" ? "bg-[#0891B2]" : "bg-slate-400"
                }`} />
                <h2 className="text-lg font-bold text-slate-900 capitalize">{s} Trips ({list.length})</h2>
              </div>

              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <div key={t.trip_id} className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg text-slate-900">{t.name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                          s === "ongoing"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : s === "upcoming"
                            ? "bg-sky-50 text-[#0891B2] border border-sky-200"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 font-medium">
                        {t.start_date ?? "Open"} – {t.end_date ?? "Open"}
                      </p>
                      {t.description ? (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">{t.description}</p>
                      ) : null}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Link href={`/trips/${t.trip_id}`} className="font-bold text-[#0891B2] hover:underline">
                          View
                        </Link>
                        <Link href={`/trips/${t.trip_id}/build`} className="font-medium text-slate-700 hover:text-slate-900">
                          Builder
                        </Link>
                        <Link href={`/trips/${t.trip_id}/budget`} className="font-medium text-slate-700 hover:text-slate-900">
                          Budget
                        </Link>
                      </div>
                      <form action={deleteTrip}>
                        <input type="hidden" name="trip_id" value={t.trip_id} />
                        <button
                          type="submit"
                          className="font-medium text-red-500 hover:text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Shared Trips */}
        {(sharedTrips ?? []).length > 0 ? (
          <section>
            <h2 className="text-lg font-bold text-slate-900">Trips Shared With Me ({sharedTrips?.length})</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sharedTrips?.map((t) => (
                <div key={t.trip_id} className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between">
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900">{t.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.start_date ?? "Open"} – {t.end_date ?? "Open"}
                    </p>
                    <span className="mt-2 inline-block rounded bg-teal-50 px-2 py-0.5 text-xs text-[#0891B2] font-semibold border border-teal-200">
                      Shared Trip
                    </span>
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 flex gap-3 text-xs">
                    <Link href={`/trips/${t.trip_id}`} className="font-bold text-[#0891B2] hover:underline">
                      View
                    </Link>
                    <Link href={`/trips/${t.trip_id}/build`} className="font-medium text-slate-700 hover:text-slate-900">
                      Builder
                    </Link>
                    <Link href={`/trips/${t.trip_id}/budget`} className="font-medium text-slate-700 hover:text-slate-900">
                      Budget
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(!ownTrips?.length && !sharedTrips?.length) ? (
          <div className="rounded-xl border border-dashed border-teal-900/20 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">You haven't planned any trips yet.</p>
            <p className="text-xs text-slate-500 mt-1">Start building your multi-city dream itinerary today.</p>
            <Link
              href="/trips/new"
              className="btn-coral mt-4 inline-block px-6 py-2.5 text-sm font-semibold shadow-md"
            >
              Plan Your First Trip
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
