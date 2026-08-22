import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { tripId } = await params;
  const { error, message } = await searchParams;
  const { supabase, user } = await requireActiveUser();

  // Fetch the trip, ensuring the current user owns it or is a collaborator
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();

  // RLS: only owners/collaborators can read. If no row, don't leak.
  if (!trip) notFound();

  // Fetch stops with city info
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });

  // Fetch cities for name/country resolution
  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = stopCityIds.length
    ? await supabase.from("cities").select("*").in("city_id", stopCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Fetch trip activities across all stops
  const { data: tripActivities } = (stops ?? []).length
    ? await supabase
        .from("trip_activities")
        .select("*")
        .in("stop_id", (stops ?? []).map((s) => s.stop_id))
        .order("day_number", { ascending: true })
    : { data: [] };

  // Map activity_id -> activity
  const { data: activities } = (tripActivities ?? []).length
    ? await supabase
        .from("activities")
        .select("activity_id, name, category")
        .in(
          "activity_id",
          (tripActivities ?? [])
            .map((ta) => ta.activity_id)
            .filter((id): id is string => !!id),
        )
    : { data: [] };
  const activityById = new Map((activities ?? []).map((a) => [a.activity_id, a]));

  // Group activities per stop
  const activitiesByStop: Record<string, (typeof tripActivities)[number][]> = {};
  for (const ta of tripActivities ?? []) {
    (activitiesByStop[ta.stop_id] ??= []).push(ta);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{trip.name}</h1>
          <p className="text-sm text-zinc-500">
            {trip.start_date ?? "TBD"} – {trip.end_date ?? "TBD"} ·{" "}
            <span className="capitalize">{trip.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/trips/${tripId}/build`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Edit itinerary
          </Link>
          <Link
            href={`/trips/${tripId}/budget`}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Budget
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>
      ) : null}

      {trip.description ? (
        <p className="mt-4 text-sm text-zinc-600">{trip.description}</p>
      ) : null}

      <div className="mt-8 space-y-8">
        {(stops ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-zinc-500">
            <p>This trip has no stops yet.</p>
            <Link href={`/trips/${tripId}/build`} className="mt-2 inline-block text-blue-600 underline">
              Add your first stop
            </Link>
          </div>
        ) : (
          (stops ?? []).map((stop, i) => {
            const city = cityById.get(stop.city_id);
            const dayActivities = activitiesByStop[stop.stop_id] ?? [];
            return (
              <section key={stop.stop_id}>
                <h2 className="text-xl font-semibold">
                  {i + 1}. {city?.name ?? "Unknown city"}
                  <span className="ml-2 text-sm font-normal text-zinc-500">{city?.country}</span>
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {stop.start_date ?? "TBD"} – {stop.end_date ?? "TBD"}
                </p>
                {stop.section_budget_inr ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    Section budget: ₹{stop.section_budget_inr.toLocaleString("en-IN")}
                  </p>
                ) : null}
                {stop.notes ? <p className="mt-2 text-sm text-zinc-600">{stop.notes}</p> : null}

                <div className="mt-4 overflow-hidden rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-zinc-50">
                      <tr>
                        <th className="px-4 py-2 font-medium">Day</th>
                        <th className="px-4 py-2 font-medium">Activity</th>
                        <th className="px-4 py-2 font-medium">Category</th>
                        <th className="px-4 py-2 text-right font-medium">Planned cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayActivities.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-zinc-500">
                            No activities planned yet.
                          </td>
                        </tr>
                      ) : (
                        dayActivities.map((ta) => {
                          const cat =
                            activityById.get(ta.activity_id ?? "")?.category ??
                            "Custom";
                          const name =
                            ta.custom_name ??
                            activityById.get(ta.activity_id ?? "")?.name ??
                            "Unnamed";
                          return (
                            <tr key={ta.id} className="border-b last:border-0">
                              <td className="px-4 py-2">Day {ta.day_number}</td>
                              <td className="px-4 py-2">
                                {name}
                                {ta.scheduled_time ? (
                                  <span className="ml-2 text-xs text-zinc-400">
                                    {ta.scheduled_time}
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-2 text-zinc-500">{catActivity}</td>
                              <td className="px-4 py-2 text-right">
                                {ta.planned_cost_inr
                                  ? `₹${ta.planned_cost_inr.toLocaleString("en-IN")}`
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}