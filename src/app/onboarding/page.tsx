import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { completeOnboardingAction, logoutAction } from "@/lib/actions/auth";
import { ImageUploadInput } from "@/components/image-upload-input";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await searchParams;

  // Fetch current profile & private info if any
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: privateProfile } = await supabase
    .from("profile_private")
    .select("phone_number")
    .eq("user_id", user.id)
    .maybeSingle();

  // Extract names from Google metadata if not yet saved in profile
  const meta = user.user_metadata || {};
  const metaFullName = meta.full_name || meta.name || "";
  const nameParts = metaFullName.trim().split(" ");
  const metaGivenName = meta.given_name || (nameParts.length ? nameParts[0] : "");
  const metaFamilyName = meta.family_name || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  const initialFirstName = profile?.first_name || metaGivenName || "";
  const initialLastName = profile?.last_name || metaFamilyName || "";
  const initialPhone = privateProfile?.phone_number || "";
  const initialHomeCity = profile?.home_city || "";
  const initialHomeCountry = profile?.home_country || "";
  const initialBio = profile?.bio || "";
  const initialCurrency = profile?.preferred_currency || "INR";

  // Fetch available currency options
  const { data: currencies } = await supabase
    .from("currency_rates")
    .select("currency_code")
    .order("currency_code");

  const currencyCodes = currencies?.map((c) => c.currency_code) ?? ["INR", "USD", "EUR", "GBP", "JPY"];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Step 2 of 2
          </span>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">Complete Your Profile</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome to GlobeTrotter! Please provide your details to finalize setting up your account.
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}

        <form action={completeOnboardingAction} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              First name *
              <input
                name="first_name"
                required
                defaultValue={initialFirstName}
                placeholder="First name"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Last name
              <input
                name="last_name"
                defaultValue={initialLastName}
                placeholder="Last name"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Email address
            <input
              type="email"
              disabled
              value={user.email || ""}
              className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Phone number *
            <input
              type="tel"
              name="phone_number"
              required
              defaultValue={initialPhone}
              placeholder="+1 (555) 000-0000"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Home city *
              <input
                name="home_city"
                required
                defaultValue={initialHomeCity}
                placeholder="e.g. San Francisco"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Home country *
              <input
                name="home_country"
                required
                defaultValue={initialHomeCountry}
                placeholder="e.g. USA"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Preferred currency
            <select
              name="preferred_currency"
              defaultValue={initialCurrency}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            >
              {currencyCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Bio / Travel Style
            <textarea
              name="bio"
              rows={3}
              defaultValue={initialBio}
              placeholder="Tell others what kind of travel you love (e.g. backpacker, foodie, architecture fan)..."
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </label>

          <ImageUploadInput
            name="photo_url"
            label="Profile Avatar (optional)"
            defaultValue={profile?.photo_url ?? meta.avatar_url ?? meta.picture ?? ""}
            folder="avatars"
            placeholder="https://example.com/avatar.jpg"
          />

          <button
            type="submit"
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Save & Start Exploring
          </button>
        </form>

        <div className="mt-4 border-t pt-4 text-center">
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-zinc-800 underline"
            >
              Sign out and finish later
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
