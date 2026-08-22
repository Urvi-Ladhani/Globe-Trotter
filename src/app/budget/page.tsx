import Link from "next/link";
import { requireActiveUser, convertFromInr, formatMoney } from "@/lib/auth";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function GeneralBudgetPage() {
  const { supabase, user, profile } = await requireActiveUser();

  // Fetch currency rate for user's preferred currency
  const currencyCode = profile?.preferred_currency || "INR";
  const { data: rateData } = await supabase
    .from("currency_rates")
    .select("rate_to_inr")
    .eq("currency_code", currencyCode)
    .maybeSingle();

  const rateToInr = rateData?.rate_to_inr || 1;

  // Fetch user's trips
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_id, name, status, start_date, end_date, estimated_budget_inr")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  const tripIds = (trips ?? []).map((t) => t.trip_id);

  // Fetch all expenses for these trips
  const { data: allExpenses } = tripIds.length
    ? await supabase.from("expenses").select("trip_id, amount_inr").in("trip_id", tripIds)
    : { data: [] };

  const expensesByTrip: Record<string, number> = {};
  for (const exp of allExpenses ?? []) {
    expensesByTrip[exp.trip_id] = (expensesByTrip[exp.trip_id] || 0) + (exp.amount_inr || 0);
  }

  // Calculate cumulative stats
  const totalBudgetInr = (trips ?? []).reduce((acc, t) => acc + (t.estimated_budget_inr || 0), 0);
  const totalExpensesInr = (allExpenses ?? []).reduce((acc, e) => acc + (e.amount_inr || 0), 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Trip Budgets Overview</h1>
          <p className="text-sm text-zinc-500">
            Track expenses across all your trips in <span className="font-semibold text-zinc-800">{currencyCode}</span>.
          </p>
        </div>

        {/* Global Summary */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-zinc-500">Total Planned Budget</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {formatMoney(convertFromInr(totalBudgetInr, rateToInr), currencyCode)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-zinc-500">Total Logged Expenses</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {formatMoney(convertFromInr(totalExpensesInr, rateToInr), currencyCode)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-zinc-500">Remaining Budget</p>
            <p className={`mt-2 text-2xl font-bold ${totalBudgetInr - totalExpensesInr >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatMoney(convertFromInr(totalBudgetInr - totalExpensesInr, rateToInr), currencyCode)}
            </p>
          </div>
        </div>

        {/* Trips Budget List */}
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Trips Breakdown</h2>
          {(trips ?? []).length === 0 ? (
            <p className="rounded-lg border bg-white p-6 text-sm text-zinc-500">No trips found.</p>
          ) : (
            (trips ?? []).map((t) => {
              const spentInr = expensesByTrip[t.trip_id] || 0;
              const budgetInr = t.estimated_budget_inr || 0;
              const spentConverted = convertFromInr(spentInr, rateToInr);
              const budgetConverted = convertFromInr(budgetInr, rateToInr);
              const percentage = budgetInr > 0 ? Math.min((spentInr / budgetInr) * 100, 100) : 0;

              return (
                <div key={t.trip_id} className="flex flex-col justify-between rounded-lg border bg-white p-5 shadow-sm sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{t.name}</h3>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-600">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {t.start_date ?? "TBD"} – {t.end_date ?? "TBD"}
                    </p>

                    <div className="mt-3 max-w-md">
                      <div className="flex justify-between text-xs text-zinc-600 mb-1">
                        <span>Spent: {formatMoney(spentConverted, currencyCode)}</span>
                        <span>Budget: {budgetInr ? formatMoney(budgetConverted, currencyCode) : "Not set"}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full ${percentage >= 90 ? "bg-red-500" : "bg-zinc-800"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/trips/${t.trip_id}/budget`}
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 inline-block"
                    >
                      Manage Budget →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
