import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { LandingTripsView } from "@/components/landing-trips-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user, profile } = await requireActiveUser();

  // Fetch user's trips ordered by date
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });

  const userName = profile?.first_name || "Traveler";

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-20">
        <LandingTripsView
          trips={trips ?? []}
          userName={userName}
        />
      </main>
    </div>
  );
}