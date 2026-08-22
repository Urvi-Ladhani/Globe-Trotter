import Link from "next/link";
import { requireActiveUser, convertFromInr, formatMoney } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { Calendar, ArrowRight, Wallet } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-6 px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Trip Budgets Overview</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track and convert expenses across all trips in <span className="font-bold text-[#0891B2]">{currencyCode}</span>.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Total Planned Budget</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatMoney(convertFromInr(totalBudgetInr, rateToInr), currencyCode)}
            </p>
          </div>
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Total Logged Expenses</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatMoney(convertFromInr(totalExpensesInr, rateToInr), currencyCode)}
            </p>
          </div>
          <div className="pacific-card p-5">
            <p className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">Remaining Balance</p>
            <p className={`mt-2 text-2xl font-extrabold ${totalBudgetInr - totalExpensesInr >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {formatMoney(convertFromInr(totalBudgetInr - totalExpensesInr, rateToInr), currencyCode)}
            </p>
          </div>
        </div>

        {/* Trips Budget List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Trips Breakdown</h2>
          {(trips ?? []).length === 0 ? (
            <div className="pacific-card p-8 text-center text-sm text-slate-500">No trips found.</div>
          ) : (
            (trips ?? []).map((t) => {
              const spentInr = expensesByTrip[t.trip_id] || 0;
              const budgetInr = t.estimated_budget_inr || 0;
              const spentConverted = convertFromInr(spentInr, rateToInr);
              const budgetConverted = convertFromInr(budgetInr, rateToInr);
              const percentage = budgetInr > 0 ? Math.min((spentInr / budgetInr) * 100, 100) : 0;

              return (
                <div key={t.trip_id} className="pacific-card p-5 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-lg text-slate-900">{t.name}</h3>
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold capitalize text-[#0891B2] border border-sky-200">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{t.start_date ?? "TBD"} – {t.end_date ?? "TBD"}</span>
                    </p>

                    <div className="mt-3 max-w-md">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Spent: {formatMoney(spentConverted, currencyCode)}</span>
                        <span>Budget: {budgetInr ? formatMoney(budgetConverted, currencyCode) : "Not set"}</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${percentage >= 90 ? "bg-red-500" : "bg-[#FF5A5F]"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Link
                      href={`/trips/${t.trip_id}/budget`}
                      className="btn-coral px-4 py-2 text-xs font-bold shadow-xs inline-flex items-center gap-1"
                    >
                      <span>Manage Budget</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
