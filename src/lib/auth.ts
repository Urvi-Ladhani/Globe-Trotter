import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type Profile = Tables<"profiles">;

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function requireActiveUser() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.status === "suspended") {
    redirect("/login?error=suspended");
  }
  return { supabase, user, profile };
}

export async function requireAdmin() {
  const { supabase, user, profile } = await requireActiveUser();
  if (profile?.role !== "admin") {
    redirect("/");
  }
  return { supabase, user, profile };
}

export const ACTIVITY_CATEGORIES = [
  "Sightseeing",
  "Food",
  "Adventure",
  "Culture",
  "Nature",
  "Shopping",
  "Nightlife",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Transport",
  "Accommodation",
  "Meals",
  "Activities",
  "Other",
] as const;

export function convertFromInr(amountInr: number, rateToInr: number) {
  if (!rateToInr) return amountInr;
  return amountInr / rateToInr;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export function emptyToNull(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length ? s : null;
}

export function numOrNull(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
