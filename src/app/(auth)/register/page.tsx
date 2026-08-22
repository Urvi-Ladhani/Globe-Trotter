import { registerAction } from "@/lib/actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Start planning multi-city trips in minutes.
        </p>
        {error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}
        <form action={registerAction} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            First name *
            <input name="first_name" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Last name
            <input name="last_name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Email *
            <input type="email" name="email" required autoComplete="email" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Password *
            <input type="password" name="password" required autoComplete="new-password" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Phone number
            <input type="tel" name="phone" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Home city
            <input name="home_city" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Home country
            <input name="home_country" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
            Bio
            <textarea name="bio" rows={3} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 sm:col-span-2">
            Sign up
          </button>
        </form>
        <p className="mt-4 text-sm text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-zinc-900 underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}