import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { supabase, user, profile } = await requireActiveUser();
  const params = await searchParams;

  const today = new Date();
  const currentYear = params.year ? parseInt(params.year) : today.getFullYear();
  const currentMonth = params.month ? parseInt(params.month) : today.getMonth() + 1; // 1-indexed

  // Fetch all user trips with dates
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_id, name, status, start_date, end_date, description")
    .eq("user_id", user.id)
    .not("start_date", "is", null)
    .order("start_date", { ascending: true });

  // Fetch stops with cities
  const tripIds = (trips ?? []).map((t) => t.trip_id);
  const { data: stops } = tripIds.length
    ? await supabase
        .from("trip_stops")
        .select("stop_id, trip_id, city_id, start_date, end_date")
        .in("trip_id", tripIds)
        .order("start_date")
    : { data: [] };

  const cityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = cityIds.length
    ? await supabase.from("cities").select("city_id, name, country").in("city_id", cityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Calculate days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to check if a date string falls inside this day
  const getTripsForDay = (day: number) => {
    const formattedDay = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return (trips ?? []).filter((t) => {
      if (!t.start_date) return false;
      const start = t.start_date;
      const end = t.end_date || t.start_date;
      return formattedDay >= start && formattedDay <= end;
    });
  };

  const getStopsForDay = (day: number) => {
    const formattedDay = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return (stops ?? []).filter((s) => {
      const start = s.start_date;
      const end = s.end_date || s.start_date;
      return formattedDay >= start && formattedDay <= end;
    });
  };

  // Prev & Next navigation
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Travel Calendar</h1>
            <p className="text-sm text-zinc-500">Visualize all your scheduled trips and itinerary stops chronologically.</p>
          </div>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + Plan New Trip
          </Link>
        </div>

        {/* Month Navigation */}
        <div className="mt-6 flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?year=${prevYear}&month=${prevMonth}`}
              className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
            >
              ← Previous
            </Link>
            <Link
              href={`/calendar?year=${today.getFullYear()}&month=${today.getMonth() + 1}`}
              className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
            >
              Today
            </Link>
            <Link
              href={`/calendar?year=${nextYear}&month=${nextMonth}`}
              className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
            >
              Next →
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b bg-zinc-50 text-center text-xs font-semibold text-zinc-500 py-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 divide-x divide-y">
            {/* Blank leading slots */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-28 bg-zinc-50/50 p-1.5 text-zinc-300" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayTrips = getTripsForDay(day);
              const dayStops = getStopsForDay(day);
              const isToday =
                today.getFullYear() === currentYear &&
                today.getMonth() + 1 === currentMonth &&
                today.getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-28 p-1.5 overflow-y-auto ${isToday ? "bg-amber-50/40" : "bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? "rounded-full bg-amber-600 px-1.5 py-0.5 text-white" : "text-zinc-700"
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayTrips.map((t) => (
                      <Link
                        key={t.trip_id}
                        href={`/trips/${t.trip_id}`}
                        className="block truncate rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-900 hover:bg-blue-200"
                        title={t.name}
                      >
                        ✈ {t.name}
                      </Link>
                    ))}

                    {dayStops.map((s) => {
                      const city = cityMap.get(s.city_id);
                      return (
                        <div
                          key={s.stop_id}
                          className="block truncate rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700"
                          title={`Stop in ${city?.name ?? "City"}`}
                        >
                          📍 {city?.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Trips Summary */}
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Scheduled Trips Timeline</h2>
          <div className="mt-4 divide-y">
            {(trips ?? []).length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">No scheduled trips with start and end dates.</p>
            ) : (
              (trips ?? []).map((t) => (
                <div key={t.trip_id} className="flex flex-wrap items-center justify-between py-3 gap-3">
                  <div>
                    <h3 className="font-semibold text-sm">{t.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {t.start_date} – {t.end_date ?? "Open"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/trips/${t.trip_id}`}
                      className="rounded border px-3 py-1 text-xs font-semibold hover:bg-zinc-50"
                    >
                      View Itinerary
                    </Link>
                    <Link
                      href={`/trips/${t.trip_id}/build`}
                      className="rounded bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700"
                    >
                      Edit Stops
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
