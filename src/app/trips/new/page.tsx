import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { createTrip } from "@/lib/actions/trips";
import { Nav } from "@/components/nav";
import { ImageUploadInput } from "@/components/image-upload-input";

export const dynamic = "force-dynamic";

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; city_id?: string }>;
}) {
  const { supabase, profile } = await requireActiveUser();
  const { error, city_id } = await searchParams;

  // Query popular cities for suggestions
  const { data: popularCities } = await supabase
    .from("cities")
    .select("city_id, name, country, image_url")
    .order("popularity_score", { ascending: false })
    .limit(6);

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0891B2]">Itinerary Builder</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Plan a New Trip</h1>
          </div>
          <Link href="/trips" className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline">
            Cancel
          </Link>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {error}
          </p>
        ) : null}

        <form action={createTrip} className="mt-6 flex flex-col gap-5 pacific-card p-6 sm:p-8">
          {city_id ? <input type="hidden" name="initial_city_id" value={city_id} /> : null}

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-800">
            Trip Name *
            <input
              name="name"
              required
              placeholder="e.g. Italian Coastline Adventure"
              className="pacific-input"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-800">
              Start Date
              <input
                type="date"
                name="start_date"
                className="pacific-input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-800">
              End Date
              <input
                type="date"
                name="end_date"
                className="pacific-input"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-800">
            Estimated Budget (INR)
            <input
              type="number"
              name="estimated_budget_inr"
              placeholder="e.g. 150000"
              className="pacific-input"
            />
          </label>

          <ImageUploadInput
            name="cover_photo_url"
            label="Trip Cover Photo (Upload or Paste Link)"
            folder="trips"
            placeholder="https://images.unsplash.com/photo-..."
          />

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-800">
            Trip Notes / Description
            <textarea
              name="description"
              rows={3}
              placeholder="What are your goals or notes for this trip?"
              className="pacific-input"
            />
          </label>

          {/* Visibility Options */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800">Trip Visibility</label>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  defaultChecked
                  className="mt-0.5"
                />
                <div>
                  <p className="font-bold text-xs text-slate-900">🔒 Private</p>
                  <p className="text-[10px] text-slate-500 font-normal">Only you & invited partners.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="link_only"
                  className="mt-0.5"
                />
                <div>
                  <p className="font-bold text-xs text-slate-900">🔗 Link Only</p>
                  <p className="text-[10px] text-slate-500 font-normal">Anyone with secret link can view.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  className="mt-0.5"
                />
                <div>
                  <p className="font-bold text-xs text-slate-900">🌍 Public</p>
                  <p className="text-[10px] text-slate-500 font-normal">Discoverable by community.</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn-coral mt-2 py-3 text-sm font-bold shadow-md"
          >
            Create Trip & Build Itinerary →
          </button>
        </form>

        {/* Popular Destination Quick-Picks */}
        <div className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Popular destination ideas</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {popularCities?.map((c) => (
              <div key={c.city_id} className="pacific-card p-3 text-xs">
                <p className="font-bold text-slate-900">{c.name}</p>
                <p className="text-[11px] text-slate-500">{c.country}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
