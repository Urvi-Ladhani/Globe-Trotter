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
    const s = t.status || "upcoming";
    (groups[s] ??= []).push(t);
  }

  const order = ["ongoing", "upcoming", "completed"];

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Trips</h1>
            <p className="text-sm text-zinc-500">View and manage all your travel itineraries.</p>
          </div>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + Plan New Trip
          </Link>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 ? (
          <section className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-base font-semibold text-amber-900">Trip Collaboration Invites ({pendingInvites.length})</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {pendingInvites.map((inv) => {
                const t = pendingTripMap.get(inv.trip_id);
                return (
                  <div key={inv.trip_id} className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                    <div>
                      <h3 className="font-semibold">{t?.name ?? "Trip Invitation"}</h3>
                      <p className="text-xs text-zinc-500">
                        {t?.start_date ?? "TBD"} – {t?.end_date ?? "TBD"} · Permission: <span className="font-medium">{inv.permission}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={respondToInvite}>
                        <input type="hidden" name="trip_id" value={inv.trip_id} />
                        <input type="hidden" name="status" value="accepted" />
                        <button type="submit" className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Accept</button>
                      </form>
                      <form action={respondToInvite}>
                        <input type="hidden" name="trip_id" value={inv.trip_id} />
                        <input type="hidden" name="status" value="declined" />
                        <button type="submit" className="rounded border px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Decline</button>
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
            <section key={s} className="mt-8">
              <h2 className="text-lg font-semibold capitalize">{s} Trips ({list.length})</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <div key={t.trip_id} className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{t.name}</h3>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-700">
                          {t.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {t.start_date ?? "Open"} – {t.end_date ?? "Open"}
                      </p>
                      {t.description ? (
                        <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{t.description}</p>
                      ) : null}
                    </div>

                    <div className="mt-5 border-t pt-3 flex items-center justify-between text-sm">
                      <div className="flex gap-3">
                        <Link href={`/trips/${t.trip_id}`} className="font-medium text-blue-600 hover:underline">
                          View
                        </Link>
                        <Link href={`/trips/${t.trip_id}/build`} className="font-medium text-zinc-700 hover:underline">
                          Builder
                        </Link>
                        <Link href={`/trips/${t.trip_id}/budget`} className="font-medium text-zinc-700 hover:underline">
                          Budget
                        </Link>
                      </div>
                      <form action={deleteTrip}>
                        <input type="hidden" name="trip_id" value={t.trip_id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
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

        {/* Shared / Collaborator Trips */}
        {(sharedTrips ?? []).length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Trips Shared With Me ({sharedTrips?.length})</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sharedTrips?.map((t) => (
                <div key={t.trip_id} className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm">
                  <div>
                    <h3 className="font-semibold text-lg">{t.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {t.start_date ?? "Open"} – {t.end_date ?? "Open"}
                    </p>
                    <span className="mt-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-medium">
                      Shared Trip
                    </span>
                  </div>
                  <div className="mt-5 border-t pt-3 flex gap-3 text-sm">
                    <Link href={`/trips/${t.trip_id}`} className="font-medium text-blue-600 hover:underline">
                      View
                    </Link>
                    <Link href={`/trips/${t.trip_id}/build`} className="font-medium text-zinc-700 hover:underline">
                      Builder
                    </Link>
                    <Link href={`/trips/${t.trip_id}/budget`} className="font-medium text-zinc-700 hover:underline">
                      Budget
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(!ownTrips?.length && !sharedTrips?.length) ? (
          <div className="mt-12 rounded-lg border border-dashed p-10 text-center">
            <p className="text-zinc-500">You havent planned any trips yet.</p>
            <Link
              href="/trips/new"
              className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Plan Your First Trip
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
