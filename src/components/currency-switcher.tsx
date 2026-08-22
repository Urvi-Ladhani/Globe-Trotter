"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function CurrencySwitcher({
  currencies,
  defaultCurrency,
}: {
  currencies: string[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleCurrencyChange = (newCurrency: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("display_currency", newCurrency);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-xs">
      <span className="text-xs font-bold text-slate-500">Display Currency:</span>
      <select
        defaultValue={defaultCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        className="text-xs font-bold text-[#0891B2] focus:outline-hidden cursor-pointer bg-transparent"
      >
        {currencies.map((curr) => (
          <option key={curr} value={curr}>
            {curr}
          </option>
        ))}
      </select>
    </div>
  );
}
