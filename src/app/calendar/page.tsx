import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { supabase, user, profile } = await requireActiveUser();
  const { month, year } = await searchParams;

  const now = new Date();
  const currentYear = year ? parseInt(year, 10) : now.getFullYear();
  const currentMonth = month ? parseInt(month, 10) - 1 : now.getMonth(); // 0-indexed

  // 1. Fetch user's trips
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_id, name, status, start_date, end_date")
    .eq("user_id", user.id);

  // 2. Fetch stops for user's trips
  const tripIds = (trips ?? []).map((t) => t.trip_id);
  const { data: stops } = tripIds.length
    ? await supabase.from("trip_stops").select("*").in("trip_id", tripIds)
    : { data: [] };

  // Fetch city names
  const cityIds = Array.from(new Set((stops ?? []).map((s) => s.city_id)));
  const { data: cities } = cityIds.length
    ? await supabase.from("cities").select("city_id, name, country").in("city_id", cityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Calendar Grid Calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Prev / Next month URLs
  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const nextDate = new Date(currentYear, currentMonth + 1, 1);
  const prevMonthUrl = `/calendar?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`;
  const nextMonthUrl = `/calendar?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`;

  // Helper to check if a date string falls on year-month-day
  const getEventsForDay = (day: number) => {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayDate = new Date(dayStr);

    const matchingStops = (stops ?? []).filter((s) => {
      if (!s.start_date || !s.end_date) return false;
      const start = new Date(s.start_date);
      const end = new Date(s.end_date);
      return dayDate >= start && dayDate <= end;
    });

    const matchingTrips = (trips ?? []).filter((t) => {
      if (!t.start_date || !t.end_date) return false;
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      return dayDate >= start && dayDate <= end;
    });

    return { matchingTrips, matchingStops };
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-8 px-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">Trip Calendar</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {monthNames[currentMonth]} {currentYear}
            </h1>
            <p className="mt-1 text-sm text-slate-600">Visual monthly overview of all your booked and upcoming destination stops.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={prevMonthUrl}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              ← Prev
            </Link>
            <Link
              href={`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`}
              className="rounded-lg bg-[#0B4F6C] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0E6C8F] shadow-xs"
            >
              Today
            </Link>
            <Link
              href={nextMonthUrl}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              Next →
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Calendar Grid */}
        <div className="pacific-card overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-teal-900/10 bg-slate-50/80 text-center text-xs font-bold text-slate-600 uppercase py-3">
            {daysOfWeek.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
            {/* Empty prefix days */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/40 p-2" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { matchingStops, matchingTrips } = getEventsForDay(day);
              const isToday =
                day === now.getDate() &&
                currentMonth === now.getMonth() &&
                currentYear === now.getFullYear();

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[110px] p-2 transition-colors hover:bg-sky-50/30 ${
                    isToday ? "bg-amber-50/40" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5A5F] text-white shadow-xs"
                          : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {matchingStops.map((s) => {
                      const city = cityMap.get(s.city_id);
                      return (
                        <Link
                          key={s.stop_id}
                          href={`/trips/${s.trip_id}`}
                          className="block truncate rounded bg-[#E0F2FE] px-1.5 py-0.5 text-[10px] font-bold text-[#0B4F6C] hover:bg-[#BAE6FD]"
                          title={`${city?.name ?? "City"}`}
                        >
                          📍 {city?.name ?? "Stop"}
                        </Link>
                      );
                    })}

                    {matchingStops.length === 0 && matchingTrips.map((t) => (
                      <Link
                        key={t.trip_id}
                        href={`/trips/${t.trip_id}`}
                        className="block truncate rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#0891B2]"
                      >
                        ✈ {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
