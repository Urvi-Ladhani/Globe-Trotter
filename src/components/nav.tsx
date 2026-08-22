import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

export function Nav({ profile, isAdmin }: { profile?: { first_name: string; last_name: string; role: string } | null; isAdmin?: boolean }) {
  const name = profile ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : "Account";
  const links = [
    { href: "/trips", label: "Trips" },
    { href: "/cities", label: "Cities" },
    { href: "/activities", label: "Activities" },
    { href: "/budget", label: "Budget" },
    { href: "/calendar", label: "Calendar" },
    { href: "/community", label: "Community" },
  ];
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold">GlobeTrotter</Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {links.map((l) => <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>)}
          {isAdmin ? <Link href="/admin" className="hover:underline">Admin</Link> : null}
          <Link href="/profile" className="hover:underline">{name}</Link>
          <form action={logoutAction}>
            <button type="submit" className="rounded border px-2 py-1 hover:bg-zinc-100">Log out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}