import { getAuthUser, getProfile } from "@/lib/auth";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user } = await getAuthUser();
  
  let profile = null;
  let dbTrips: any[] = [];
  
  if (user) {
    profile = await getProfile(user.id);
    
    // Fetch user's trips from database with stops and city names
    const { data: trips } = await supabase
      .from("trips")
      .select(`
        trip_id,
        name,
        status,
        start_date,
        end_date,
        cover_photo_url,
        estimated_budget_inr,
        trip_stops (
          order_index,
          city:cities (
            name
          )
        )
      `)
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });
      
    dbTrips = trips || [];
  }

  // Fetch popular cities from the database for recommendations
  const { data: dbCities } = await supabase
    .from("cities")
    .select("city_id, name, country, popularity_score, cost_index, image_url, description")
    .order("popularity_score", { ascending: false })
    .limit(5);

  return (
    <HomeClient 
      userProfile={profile ? { 
        first_name: profile.first_name || '', 
        last_name: profile.last_name || '', 
        email: user?.email || '' 
      } : null}
      dbTrips={dbTrips}
      dbCities={dbCities || []}
    />
  );
}
