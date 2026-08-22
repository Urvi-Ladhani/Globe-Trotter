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
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Plan a New Trip</h1>
          <Link href="/trips" className="text-sm text-zinc-500 hover:underline">Cancel</Link>
        </div>

        {error ? (
          <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}

        <form action={createTrip} className="mt-6 flex flex-col gap-4 rounded-lg border bg-white p-6 shadow-sm">
          {city_id ? <input type="hidden" name="initial_city_id" value={city_id} /> : null}

          <label className="flex flex-col gap-1 text-sm font-medium">
            Trip name *
            <input
              name="name"
              required
              placeholder="e.g. Summer in Southern Italy"
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Start date
              <input
                type="date"
                name="start_date"
                className="rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              End date
              <input
                type="date"
                name="end_date"
                className="rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Estimated budget (INR)
            <input
              type="number"
              name="estimated_budget_inr"
              placeholder="e.g. 150000"
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <ImageUploadInput
            name="cover_photo_url"
            label="Trip Cover Photo"
            folder="trips"
            placeholder="https://images.unsplash.com/photo-..."
          />

          <label className="flex flex-col gap-1 text-sm font-medium">
            Description
            <textarea
              name="description"
              rows={3}
              placeholder="What are your goals or notes for this trip?"
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Create trip & start building itinerary
          </button>
        </form>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Popular destination ideas</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {popularCities?.map((c) => (
              <div key={c.city_id} className="rounded-lg border bg-white p-3 text-sm">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-zinc-500">{c.country}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
