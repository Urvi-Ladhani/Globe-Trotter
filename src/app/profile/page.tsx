import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";
import { updateProfile, updatePhoneNumber, removeSavedDestination } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { supabase, user, profile } = await requireActiveUser();
  const { error, success } = await searchParams;

  // 1. Fetch private profile (phone_number)
  const { data: privateProfile } = await supabase
    .from("profile_private")
    .select("phone_number")
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Fetch saved destinations
  const { data: savedDestinations } = await supabase
    .from("saved_destinations")
    .select("saved_id, city_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Fetch city details for saved destinations
  const cityIds = (savedDestinations ?? []).map((s) => s.city_id);
  const { data: cities } = cityIds.length
    ? await supabase.from("cities").select("*").in("city_id", cityIds)
    : { data: [] };

  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // 4. Fetch available currency options
  const { data: currencies } = await supabase
    .from("currency_rates")
    .select("currency_code")
    .order("currency_code");

  const currencyCodes = currencies?.map((c) => c.currency_code) ?? [
    "INR",
    "USD",
    "EUR",
    "GBP",
    "JPY",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      {/* Header Banner */}
      <div className="border-b border-teal-900/10 bg-gradient-to-b from-[#E0F2FE]/40 to-transparent py-8 px-4">
        <div className="mx-auto max-w-5xl">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">Account Settings</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Traveler Profile</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your traveler details, private contact info, and bookmarked destinations.</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
        {error ? <p className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p> : null}
        {success ? <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">{success}</p> : null}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Public Profile Form */}
          <section className="pacific-card p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">Public Profile</h2>
            <p className="mt-0.5 text-xs text-slate-500">Visible to trip collaborators and the traveler community.</p>

            <form action={updateProfile} className="mt-6 flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  First name *
                  <input
                    name="first_name"
                    required
                    defaultValue={profile?.first_name ?? ""}
                    className="pacific-input text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Last name
                  <input
                    name="last_name"
                    defaultValue={profile?.last_name ?? ""}
                    className="pacific-input text-xs"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  Home city
                  <input
                    name="home_city"
                    defaultValue={profile?.home_city ?? ""}
                    className="pacific-input text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Home country
                  <input
                    name="home_country"
                    defaultValue={profile?.home_country ?? ""}
                    className="pacific-input text-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                Preferred currency
                <select
                  name="preferred_currency"
                  defaultValue={profile?.preferred_currency ?? "INR"}
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
                  defaultValue={profile?.bio ?? ""}
                  placeholder="Tell other travelers about yourself..."
                  className="pacific-input text-xs font-normal"
                />
              </label>

              <ImageUploadInput
                name="photo_url"
                label="Profile Avatar"
                defaultValue={profile?.photo_url ?? ""}
                folder="avatars"
                placeholder="https://example.com/avatar.jpg"
              />

              <button
                type="submit"
                className="btn-coral mt-2 py-2.5 text-xs font-bold shadow-md"
              >
                Save Profile
              </button>
            </form>
          </section>

          {/* Private Info & Account Status */}
          <div className="flex flex-col gap-6">
            <section className="pacific-card p-6">
              <h2 className="text-base font-bold text-slate-900">Private Information</h2>
              <p className="mt-0.5 text-xs text-slate-500">Only you can see this; stored securely in a private table.</p>
              
              <form action={updatePhoneNumber} className="mt-4 flex flex-col gap-3 text-xs font-semibold text-slate-700">
                <label className="flex flex-col gap-1">
                  Phone number
                  <input
                    type="tel"
                    name="phone_number"
                    defaultValue={privateProfile?.phone_number ?? ""}
                    placeholder="+1 (555) 0199"
                    className="pacific-input text-xs"
                  />
                </label>
                <button
                  type="submit"
                  className="btn-teal py-2 text-xs font-bold shadow-xs"
                >
                  Update Phone Number
                </button>
              </form>
            </section>

            <section className="pacific-card p-6">
              <h2 className="text-base font-bold text-slate-900">Account Details</h2>
              <div className="mt-3 space-y-2 text-xs">
                <p><span className="font-semibold text-slate-500">Email:</span> <span className="font-bold text-slate-800">{user.email}</span></p>
                <p><span className="font-semibold text-slate-500">Role:</span> <span className="capitalize font-bold text-[#0891B2]">{profile?.role ?? "user"}</span></p>
                <p><span className="font-semibold text-slate-500">Status:</span> <span className="capitalize font-bold text-emerald-700">{profile?.status ?? "active"}</span></p>
              </div>
            </section>
          </div>
        </div>

        {/* Saved Destinations Section */}
        <section className="pacific-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Saved Destinations ({savedDestinations?.length ?? 0})</h2>
            <Link href="/cities" className="text-xs font-bold text-[#0891B2] hover:underline">
              Explore more destinations →
            </Link>
          </div>

          {(savedDestinations ?? []).length === 0 ? (
            <p className="mt-4 text-xs text-slate-400">
              No saved destinations yet. <Link href="/cities" className="underline font-bold text-[#0891B2]">Browse cities</Link> to bookmark dream destinations.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(savedDestinations ?? []).map((s) => {
                const city = cityMap.get(s.city_id);
                return (
                  <div key={s.saved_id} className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <h3 className="font-bold text-slate-900">{city?.name ?? "City"}</h3>
                      <p className="text-xs text-slate-500">{city?.country} {city?.region ? `· ${city.region}` : ""}</p>
                      {city?.description ? <p className="mt-2 text-xs text-slate-600 line-clamp-2">{city.description}</p> : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <Link href={`/cities?search=${encodeURIComponent(city?.name ?? "")}`} className="font-bold text-[#0891B2] hover:underline">
                        View Details
                      </Link>
                      <form action={removeSavedDestination}>
                        <input type="hidden" name="saved_id" value={s.saved_id} />
                        <button type="submit" className="font-semibold text-red-500 hover:underline">
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
