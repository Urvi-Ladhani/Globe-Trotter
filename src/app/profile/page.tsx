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

  // Fetch private phone number
  const { data: privateProfile } = await supabase
    .from("profile_private")
    .select("phone_number")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch saved destinations
  const { data: savedDestinations } = await supabase
    .from("saved_destinations")
    .select("saved_id, saved_at, city_id")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const cityIds = (savedDestinations ?? []).map((s) => s.city_id);
  const { data: cities } = cityIds.length
    ? await supabase.from("cities").select("*").in("city_id", cityIds)
    : { data: [] };
  const cityMap = new Map((cities ?? []).map((c) => [c.city_id, c]));

  // Fetch available currency rates for currency selector
  const { data: currencies } = await supabase
    .from("currency_rates")
    .select("currency_code")
    .order("currency_code");

  const currencyCodes = currencies?.map((c) => c.currency_code) ?? ["INR", "USD", "EUR", "GBP", "JPY"];

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your personal details, preferences, and saved destinations.</p>

        {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Profile Details</h2>
            <form action={updateProfile} className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  First name *
                  <input
                    name="first_name"
                    required
                    defaultValue={profile?.first_name ?? ""}
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Last name
                  <input
                    name="last_name"
                    defaultValue={profile?.last_name ?? ""}
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Home city
                  <input
                    name="home_city"
                    defaultValue={profile?.home_city ?? ""}
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Home country
                  <input
                    name="home_country"
                    defaultValue={profile?.home_country ?? ""}
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm font-medium">
                Preferred currency
                <select
                  name="preferred_currency"
                  defaultValue={profile?.preferred_currency ?? "INR"}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  {currencyCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium">
                Bio
                <textarea
                  name="bio"
                  rows={3}
                  defaultValue={profile?.bio ?? ""}
                  placeholder="Tell other travelers about yourself..."
                  className="rounded-lg border px-3 py-2 text-sm"
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
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                Save Profile
              </button>
            </form>
          </section>

          <div className="flex flex-col gap-8">
            <section className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Private Information</h2>
              <p className="mt-1 text-xs text-zinc-500">Only you can see this info; it is stored separately.</p>
              <form action={updatePhoneNumber} className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Phone number
                  <input
                    type="tel"
                    name="phone_number"
                    defaultValue={privateProfile?.phone_number ?? ""}
                    placeholder="+1 555-0199"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                >
                  Update Phone Number
                </button>
              </form>
            </section>

            <section className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Account Info</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-zinc-500">Email:</span> {user.email}</p>
                <p><span className="text-zinc-500">Role:</span> <span className="capitalize">{profile?.role ?? "user"}</span></p>
                <p><span className="text-zinc-500">Status:</span> <span className="capitalize">{profile?.status ?? "active"}</span></p>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Saved Destinations</h2>
            <Link href="/cities" className="text-sm text-blue-600 underline">Explore more cities</Link>
          </div>

          {(savedDestinations ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No saved destinations yet. <Link href="/cities" className="underline text-zinc-800">Browse cities</Link> to bookmark destinations you want to visit.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(savedDestinations ?? []).map((s) => {
                const city = cityMap.get(s.city_id);
                return (
                  <div key={s.saved_id} className="flex flex-col justify-between rounded-lg border p-4">
                    <div>
                      <h3 className="font-semibold">{city?.name ?? "Unknown City"}</h3>
                      <p className="text-sm text-zinc-500">{city?.country} {city?.region ? `· ${city.region}` : ""}</p>
                      {city?.description ? <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{city.description}</p> : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Link href={`/cities?search=${encodeURIComponent(city?.name ?? "")}`} className="text-sm text-blue-600 underline">View</Link>
                      <form action={removeSavedDestination}>
                        <input type="hidden" name="saved_id" value={s.saved_id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">Remove</button>
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
