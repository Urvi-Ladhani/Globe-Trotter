import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Compass } from "lucide-react";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#FDFBF7] p-6">
      <div className="w-full max-w-lg pacific-card p-8 shadow-md">
        {/* Brand Header */}
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A5F] text-white shadow-xs">
            <Compass className="h-5 w-5" />
          </span>
          <span>Globe<span className="text-[#0891B2]">Trotter</span></span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
        <p className="mt-1 text-xs text-slate-500">
          Start planning multi-city itineraries and tracking travel budgets in minutes.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">{error}</p>
        ) : null}

        <div className="mt-6">
          <GoogleAuthButton text="Sign up with Google" />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-2.5 text-slate-400">Or register with email</span>
          </div>
        </div>

        <form action={registerAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs font-semibold text-slate-700">
          <label className="flex flex-col gap-1">
            First name *
            <input name="first_name" required placeholder="Jane" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1">
            Last name
            <input name="last_name" placeholder="Doe" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Email *
            <input type="email" name="email" required autoComplete="email" placeholder="jane@example.com" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Password *
            <input type="password" name="password" required autoComplete="new-password" placeholder="••••••••" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Phone number
            <input type="tel" name="phone" placeholder="+1 (555) 000-0000" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1">
            Home city
            <input name="home_city" placeholder="San Francisco" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1">
            Home country
            <input name="home_country" placeholder="USA" className="pacific-input text-xs" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            Bio
            <textarea name="bio" rows={2} placeholder="Favorite travel styles, bucket list destinations..." className="pacific-input text-xs font-normal" />
          </label>
          <button
            type="submit"
            className="btn-coral py-2.5 text-xs font-bold shadow-md sm:col-span-2 mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#0891B2] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}