import { createTrip } from "@/lib/actions/trips";

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold">Plan a new trip</h1>
      {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <form action={createTrip} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Trip name *
          <input name="name" required className="rounded-lg border px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Start date
            <input type="date" name="start_date" className="rounded-lg border px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            End date
            <input type="date" name="end_date" className="rounded-lg border px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Description
          <textarea name="description" rows={3} className="rounded-lg border px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
          Create trip
        </button>
      </form>
    </main>
  );
}