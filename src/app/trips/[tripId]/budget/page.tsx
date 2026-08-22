import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser, EXPENSE_CATEGORIES } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { addExpense, deleteExpense } from "@/lib/actions/trips";
import { Calendar, Trash2, Plus, ArrowLeft, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TripBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string; display_currency?: string }>;
}) {
  const { tripId } = await params;
  const { error, display_currency } = await searchParams;
  const { supabase, profile } = await requireActiveUser();

  const { data: trip } = await supabase.from("trips").select("*").eq("trip_id", tripId).maybeSingle();
  if (!trip) notFound();

  // Fetch stops for stop allocation dropdown
  const { data: stops } = await supabase
    .from("trip_stops")
    .select("stop_id, city_id, section_budget_inr")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });

  const stopCityIds = (stops ?? []).map((s) => s.city_id);
  const { data: cities } = stopCityIds.length
    ? await supabase.from("cities").select("city_id, name").in("city_id", stopCityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c.name]));

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false });

  // Fetch currency rates
  const { data: currencyRates } = await supabase
    .from("currency_rates")
    .select("currency_code, rate_to_inr")
    .order("currency_code", { ascending: true });

  const rateMap = new Map((currencyRates ?? []).map((r) => [r.currency_code, Number(r.rate_to_inr)]));
  rateMap.set("INR", 1.0);

  // Preferred display currency
  const chosenCurrency = display_currency || profile?.preferred_currency || "INR";
  const rateToInr = rateMap.get(chosenCurrency) || 1.0;

  // Convert an INR amount to display currency
  const toDisplay = (inrAmount: number | null | undefined) => {
    if (!inrAmount) return 0;
    return inrAmount / rateToInr;
  };

  const totalSpentInr = (expenses ?? []).reduce((acc, cur) => acc + Number(cur.amount_inr || 0), 0);
  const budgetInr = trip.estimated_budget_inr || 0;
  const remainingInr = budgetInr - totalSpentInr;
  const budgetPct = budgetInr > 0 ? Math.min(Math.round((totalSpentInr / budgetInr) * 100), 100) : 0;

  // Category breakdown
  const categoryTotalsInr: Record<string, number> = {};
  for (const exp of expenses ?? []) {
    categoryTotalsInr[exp.category] = (categoryTotalsInr[exp.category] || 0) + Number(exp.amount_inr || 0);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-6 px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/trips/${tripId}`} className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
              ← Back to Trip Itinerary
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Trip Budget: <span className="text-[#0891B2]">{trip.name}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Track logged expenses and category breakdowns.</p>
          </div>

          {/* Currency Switcher */}
          <form method="get" className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs">
            <span className="text-xs font-bold text-slate-500">Display Currency:</span>
            <select
              name="display_currency"
              defaultValue={chosenCurrency}
              // @ts-ignore
              onChange={(e) => e.target.form?.submit()}
              className="text-xs font-bold text-[#0891B2] focus:outline-none cursor-pointer"
            >
              {Array.from(rateMap.keys()).sort().map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </form>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Estimated Budget</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {chosenCurrency} {toDisplay(budgetInr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-slate-400">₹{budgetInr.toLocaleString("en-IN")} INR base</p>
          </div>

          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Total Spent</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {chosenCurrency} {toDisplay(totalSpentInr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-slate-400">{budgetPct}% of target budget</p>
          </div>

          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Remaining Budget</p>
            <p className={`mt-1 text-2xl font-extrabold ${remainingInr < 0 ? "text-red-600" : "text-emerald-700"}`}>
              {chosenCurrency} {toDisplay(remainingInr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-slate-400">{remainingInr < 0 ? "Over budget!" : "Available balance"}</p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="pacific-card p-5">
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Budget Utilization</span>
            <span>{budgetPct}% Used</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all ${
                budgetPct >= 100 ? "bg-red-500" : budgetPct >= 80 ? "bg-amber-500" : "bg-[#FF5A5F]"
              }`}
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <section className="pacific-card p-5">
          <h2 className="text-base font-bold text-slate-900">Category Breakdown</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXPENSE_CATEGORIES.map((cat) => {
              const inrVal = categoryTotalsInr[cat] || 0;
              const convertedVal = toDisplay(inrVal);
              return (
                <div key={cat} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <span className="text-xs font-semibold text-slate-500">{cat}</span>
                  <p className="mt-1 font-extrabold text-slate-900 text-sm">
                    {chosenCurrency} {convertedVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Log New Expense */}
        <section className="pacific-card p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2] text-xs text-white font-bold">
              +
            </span>
            <h2 className="text-base font-bold text-slate-900">Log an Expense</h2>
          </div>

          <form action={addExpense} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 text-xs font-semibold text-slate-700">
            <input type="hidden" name="trip_id" value={tripId} />

            <div className="sm:col-span-2">
              <label className="block mb-1 text-[11px] text-slate-500">Description *</label>
              <input name="description" required placeholder="e.g. Train ticket to Venice" className="pacific-input w-full text-xs" />
            </div>

            <div>
              <label className="block mb-1 text-[11px] text-slate-500">Amount (INR) *</label>
              <input type="number" step="0.01" name="amount_inr" required placeholder="₹" className="pacific-input w-full text-xs" />
            </div>

            <div>
              <label className="block mb-1 text-[11px] text-slate-500">Category *</label>
              <select name="category" required className="pacific-input w-full text-xs">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-[11px] text-slate-500">Date *</label>
              <input
                type="date"
                name="expense_date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="pacific-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block mb-1 text-[11px] text-slate-500">Stop (Optional)</label>
              <select name="stop_id" className="pacific-input w-full text-xs">
                <option value="">Trip Wide</option>
                {stops?.map((s) => (
                  <option key={s.stop_id} value={s.stop_id}>
                    {cityMap.get(s.city_id) ?? "Stop"}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
              <button
                type="submit"
                className="btn-coral px-6 py-2.5 text-xs font-bold shadow-xs"
              >
                + Save Expense
              </button>
            </div>
          </form>
        </section>

        {/* Expenses List */}
        <section className="pacific-card overflow-hidden">
          <div className="border-b border-teal-900/10 bg-slate-50/70 p-5">
            <h2 className="text-base font-bold text-slate-900">Expense Log ({expenses?.length ?? 0})</h2>
          </div>

          {(expenses ?? []).length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No expenses recorded for this trip yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses?.map((exp) => (
                <div key={exp.expense_id} className="flex items-center justify-between p-4 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{exp.description}</p>
                    <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      <span>{exp.category} · </span>
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{exp.expense_date}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {chosenCurrency} {toDisplay(exp.amount_inr).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                      {chosenCurrency !== "INR" ? (
                        <p className="text-[10px] text-slate-400">₹{exp.amount_inr.toLocaleString("en-IN")}</p>
                      ) : null}
                    </div>
                    <form action={deleteExpense}>
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="expense_id" value={exp.expense_id} />
                      <button type="submit" className="text-xs font-semibold text-red-500 hover:text-red-700" title="Delete expense">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
