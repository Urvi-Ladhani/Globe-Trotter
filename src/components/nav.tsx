"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

export function Nav({
  profile,
  isAdmin,
}: {
  profile?: { first_name: string; last_name: string; role: string; photo_url?: string | null } | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const name = profile ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : "Account";
  const links = [
    { href: "/trips", label: "Trips" },
    { href: "/cities", label: "Destinations" },
    { href: "/activities", label: "Activities" },
    { href: "/budget", label: "Budget" },
    { href: "/calendar", label: "Calendar" },
    { href: "/community", label: "Community" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B4F6C] text-white shadow-md shadow-[#0B4F6C]/10 border-b border-[#083D54]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-90">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A5F] text-white shadow-xs">
            ✈
          </span>
          <span>Globe<span className="text-[#38BDF8]">Trotter</span></span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm font-medium">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white ${pathname === l.href || pathname.startsWith(`${l.href}/`) ? "bg-white/15 font-bold text-white" : "text-sky-100"}`}
            >
              {l.label}
            </Link>
          ))}

          {isAdmin ? (
            <Link
              href="/admin"
              className={`rounded-md px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white ${pathname === "/admin" ? "bg-white/15 font-bold text-white" : "text-sky-100"}`}
            >
              Admin
            </Link>
          ) : null}

          {/* User Account / Profile */}
          <div className="ml-2 flex items-center gap-2 border-l border-white/20 pl-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              {profile?.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url}
                  alt={name}
                  className="h-5 w-5 rounded-full object-cover border border-white/40"
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5A5F] text-[10px] text-white font-bold">
                  {profile?.first_name?.[0] || "U"}
                </span>
              )}
              <span className="max-w-[110px] truncate">{name}</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-2.5 py-1 text-xs text-sky-200 hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </nav>
      </div>
    </header>
  );
}