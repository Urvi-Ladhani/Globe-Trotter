import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser, EXPENSE_CATEGORIES, convertFromInr, formatMoney } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { addExpense, deleteExpense } from "@/lib/actions/trips";

export const dynamic = "force-dynamic";

export default async function TripBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId } = await params;
  const { error } = await searchParams;
  const { supabase, profile } = await requireActiveUser();

  // Fetch trip
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (!trip) notFound();

  // Fetch currency rate for user's preferred currency
  const currencyCode = profile?.preferred_currency || "INR";
  const { data: rateData } = await supabase
    .from("currency_rates")
    .select("rate_to_inr")
    .eq("currency_code", currencyCode)
    .maybeSingle();

  const rateToInr = rateData?.rate_to_inr || 1;

  // Fetch stops
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("stop_id, city_id, start_date, end_date, section_budget_inr")
    .eq("trip_id", tripId)
    .order("order_index");

  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = stopCityIds.length
    ? await supabase.from("cities").select("city_id, name, country").in("city_id", stopCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Fetch trip activities
  const stopIds = (stops ?? []).map((s) => s.stop_id);
  const { data: tripActivities } = stopIds.length
    ? await supabase
        .from("trip_activities")
        .select("planned_cost_inr, stop_id")
        .in("stop_id", stopIds)
    : { data: [] };

  // Fetch actual expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false });

  // Calculate totals in INR
  const totalPlannedActivitiesInr = (tripActivities ?? []).reduce(
    (acc, cur) => acc + (cur.planned_cost_inr || 0),
    0
  );
  const totalExpensesInr = (expenses ?? []).reduce(
    (acc, cur) => acc + (cur.amount_inr || 0),
    0
  );

  // Group expenses by category
  const expenseByCategoryInr: Record<string, number> = {
    Transport: 0,
    Accommodation: 0,
    Meals: 0,
    Activities: totalPlannedActivitiesInr, // include planned activities in activities category
    Other: 0,
  };

  for (const exp of expenses ?? []) {
    const cat = exp.category || "Other";
    expenseByCategoryInr[cat] = (expenseByCategoryInr[cat] || 0) + (exp.amount_inr || 0);
  }

  const grandTotalInr = totalExpensesInr + totalPlannedActivitiesInr;

  // Convert to user's currency
  const totalSpentConverted = convertFromInr(grandTotalInr, rateToInr);
  const estimatedBudgetConverted = trip.estimated_budget_inr
    ? convertFromInr(trip.estimated_budget_inr, rateToInr)
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/trips/${tripId}`} className="text-sm text-blue-600 hover:underline">
              ← Back to Itinerary
            </Link>
            <h1 className="mt-1 text-2xl font-bold">Budget & Expenses: {trip.name}</h1>
            <p className="text-sm text-zinc-500">
              Amounts displayed in <span className="font-semibold text-zinc-800">{currencyCode}</span> (rate: {rateToInr} INR per {currencyCode}).
            </p>
          </div>
          <Link
            href={`/trips/${tripId}`}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            View Trip
          </Link>
        </div>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        {/* Summary Metric Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Estimated Budget</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {estimatedBudgetConverted !== null ? formatMoney(estimatedBudgetConverted, currencyCode) : "No target set"}
            </p>
            {trip.estimated_budget_inr ? (
              <p className="mt-1 text-xs text-zinc-400">₹{trip.estimated_budget_inr.toLocaleString("en-IN")}</p>
            ) : null}
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Total Tracked Costs</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {formatMoney(totalSpentConverted, currencyCode)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">₹{grandTotalInr.toLocaleString("en-IN")}</p>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-500 uppercase">Budget Remaining</p>
            {estimatedBudgetConverted !== null ? (
              <>
                <p className={`mt-2 text-2xl font-bold ${
                  estimatedBudgetConverted - totalSpentConverted >= 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {formatMoney(estimatedBudgetConverted - totalSpentConverted, currencyCode)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {((totalSpentConverted / (estimatedBudgetConverted || 1)) * 100).toFixed(0)}% used
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">Set an estimated budget to track remaining funds.</p>
            )}
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <section className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Category Breakdown</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(expenseByCategoryInr).map(([cat, amountInr]) => {
              const converted = convertFromInr(amountInr, rateToInr);
              const percentage = grandTotalInr > 0 ? (amountInr / grandTotalInr) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-700">{cat}</span>
                    <span className="text-zinc-900 font-semibold">
                      {formatMoney(converted, currencyCode)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-zinc-800 rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Add Expense Form & Log */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Add Expense Form */}
          <section className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-lg font-semibold">Log an Expense</h2>
            <form action={addExpense} className="mt-4 flex flex-col gap-3 text-sm">
              <input type="hidden" name="trip_id" value={tripId} />

              <label className="flex flex-col gap-1 text-xs font-medium">
                Category *
                <select name="category" required className="rounded-lg border px-3 py-2 text-sm">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium">
                Amount (in INR) *
                <input
                  type="number"
                  name="amount_inr"
                  required
                  placeholder="₹ Amount"
                  className="rounded-lg border px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium">
                Associated Stop
                <select name="stop_id" className="rounded-lg border px-3 py-2 text-sm">
                  <option value="">General trip expense (no stop)</option>
                  {stops?.map((s) => {
                    const city = cityMap.get(s.city_id);
                    return (
                      <option key={s.stop_id} value={s.stop_id}>
                        {city?.name ?? "Stop"} ({s.start_date})
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium">
                Expense Date
                <input
                  type="date"
                  name="expense_date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium">
                Description / Notes
                <input
                  name="description"
                  placeholder="e.g. Train ticket, Hotel deposit"
                  className="rounded-lg border px-3 py-2 text-sm"
                />
              </label>

              <button
                type="submit"
                className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                + Add Expense
              </button>
            </form>
          </section>

          {/* Expenses Table */}
          <section className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold">Expense Log</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-zinc-50 font-semibold text-zinc-600">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Amount ({currencyCode})</th>
                    <th className="px-3 py-2 text-right">INR</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(expenses ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-zinc-400">
                        No expenses logged yet for this trip.
                      </td>
                    </tr>
                  ) : (
                    (expenses ?? []).map((exp) => {
                      const converted = convertFromInr(exp.amount_inr, rateToInr);
                      return (
                        <tr key={exp.expense_id}>
                          <td className="px-3 py-2.5 text-zinc-500">{exp.expense_date ?? "—"}</td>
                          <td className="px-3 py-2.5 font-medium">{exp.category}</td>
                          <td className="px-3 py-2.5 text-zinc-600">{exp.description ?? "—"}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-zinc-900">
                            {formatMoney(converted, currencyCode)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-zinc-400">
                            ₹{exp.amount_inr.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <form action={deleteExpense}>
                              <input type="hidden" name="trip_id" value={tripId} />
                              <input type="hidden" name="expense_id" value={exp.expense_id} />
                              <button type="submit" className="text-red-600 hover:underline">
                                Delete
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
