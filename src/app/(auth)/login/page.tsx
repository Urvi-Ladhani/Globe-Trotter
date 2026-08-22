import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#FDFBF7] p-6">
      <div className="w-full max-w-md pacific-card p-8 shadow-md">
        {/* Brand Header */}
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A5F] text-white shadow-xs">
            ✈
          </span>
          <span>Globe<span className="text-[#0891B2]">Trotter</span></span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to access your multi-city itineraries and travel plans.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
            {success}
          </p>
        ) : null}

        <div className="mt-6">
          <GoogleAuthButton text="Continue with Google" />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-white px-2.5 text-slate-400">Or continue with email</span>
          </div>
        </div>

        <form action={loginAction} className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
          <label className="flex flex-col gap-1">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="pacific-input text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pacific-input text-xs"
            />
          </label>
          <button
            type="submit"
            className="btn-coral mt-1 py-2.5 text-xs font-bold shadow-md"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-[#0891B2] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}