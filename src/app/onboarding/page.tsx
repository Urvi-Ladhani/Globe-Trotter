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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7] p-4 sm:p-8">
      <div className="w-full max-w-lg pacific-card p-8 shadow-md">
        <div className="text-center">
          <span className="rounded-full bg-[#E0F2FE] px-3.5 py-1 text-xs font-bold text-[#0B4F6C] border border-[#BAE6FD]">
            Step 2 of 2 · Complete Your Profile
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Welcome to GlobeTrotter!</h1>
          <p className="mt-1 text-xs text-slate-600">
            We've pre-filled your details from Google. Add a few more pieces of information to finalize setting up your account.
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p>
        ) : null}

        <form action={completeOnboardingAction} className="mt-6 flex flex-col gap-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              First name *
              <input
                name="first_name"
                required
                defaultValue={initialFirstName}
                placeholder="First name"
                className="pacific-input text-xs"
              />
            </label>
            <label className="flex flex-col gap-1">
              Last name
              <input
                name="last_name"
                defaultValue={initialLastName}
                placeholder="Last name"
                className="pacific-input text-xs"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            Email address
            <input
              type="email"
              disabled
              value={user.email || ""}
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
            />
          </label>

          <label className="flex flex-col gap-1">
            Phone number *
            <input
              type="tel"
              name="phone_number"
              required
              defaultValue={initialPhone}
              placeholder="+1 (555) 000-0000"
              className="pacific-input text-xs"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              Home city *
              <input
                name="home_city"
                required
                defaultValue={initialHomeCity}
                placeholder="e.g. San Francisco"
                className="pacific-input text-xs"
              />
            </label>
            <label className="flex flex-col gap-1">
              Home country *
              <input
                name="home_country"
                required
                defaultValue={initialHomeCountry}
                placeholder="e.g. USA"
                className="pacific-input text-xs"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            Preferred currency
            <select
              name="preferred_currency"
              defaultValue={initialCurrency}
              className="pacific-input text-xs"
            >
              {currencyCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            Bio / Travel Style
            <textarea
              name="bio"
              rows={3}
              defaultValue={initialBio}
              placeholder="Tell others what kind of travel you love (e.g. backpacker, foodie, architecture fan)..."
              className="pacific-input text-xs font-normal"
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
            className="btn-coral mt-2 py-3 text-xs font-bold shadow-md"
          >
            Save & Start Exploring →
          </button>
        </form>

        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Sign out and finish later
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
