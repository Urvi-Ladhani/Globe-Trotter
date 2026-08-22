<<<<<<< HEAD
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { TravelSearch } from '../components/TravelSearch';
import { RegionalSelections } from '../components/RegionalSelections';
import type { Destination } from '../components/RegionalSelections';
import { PreviousTrips } from '../components/PreviousTrips';
import type { Trip } from '../components/PreviousTrips';
import { PlanTripCTA } from '../components/PlanTripCTA';
import { InspirationSection } from '../components/InspirationSection';
import { Footer } from '../components/Footer';
import { PlanTripDrawer } from '../components/PlanTripDrawer';
import { Bell } from 'lucide-react';

// Initial Mock Destinations
const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
    tag: 'Culture / Romance',
    description: 'Explore the iconic Eiffel Tower, Louvre Museum, and enjoy world-class French pastries along the Seine river.',
    rating: 4.8,
    cost: '₹45,000',
    style: 'Luxury'
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80',
    tag: 'Tech / Food',
    description: 'Immerse yourself in neon alleys, visit historic Shinto shrines, and taste fresh sushi at Tokyo Fish Markets.',
    rating: 4.9,
    cost: '₹62,000',
    style: 'Food'
  },
  {
    id: 'bali',
    city: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
    tag: 'Adventure / Beach',
    description: 'Relax in gorgeous volcanic highlands, walk through ancient Ubud temples, and surf in clear ocean waters.',
    rating: 4.7,
    cost: '₹24,500',
    style: 'Adventure'
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'UAE',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    tag: 'Modern / Luxury',
    description: 'Marvel at Burj Khalifa, ski indoors at the Mall of the Emirates, and ride dunes during an evening desert safari.',
    rating: 4.6,
    cost: '₹55,000',
    style: 'Luxury'
  },
  {
    id: 'rome',
    city: 'Rome',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
    tag: 'Ancient / History',
    description: 'Walk inside the ancient Colosseum, make a wish at the Trevi Fountain, and indulge in Rome’s authentic carbonara.',
    rating: 4.8,
    cost: '₹38,000',
    style: 'Culture'
  }
];

// Initial Mock Trips
const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    name: 'European Escape',
    route: ['Paris', 'Rome', 'Venice'],
    dates: '12 Sep — 20 Sep',
    destinationsCount: 3,
    estimatedCost: '₹43,250',
    progress: 82,
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=500&q=80' // Venice
  },
  {
    id: 'trip-2',
    name: 'Asian Odyssey',
    route: ['Tokyo', 'Kyoto', 'Osaka'],
    dates: '10 Oct — 22 Oct',
    destinationsCount: 3,
    estimatedCost: '₹85,500',
    progress: 45,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80' // Kyoto
  }
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  
  // Filtering states
  const [activeCategory, setActiveCategory] = useState('All Styles');
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  
  // Toast Notification states
  const [toastMessage, setToastMessage] = useState('');
  const [isToastActive, setIsToastActive] = useState(false);

  // Show dynamic toast alert helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastActive(true);
  };

  useEffect(() => {
    if (isToastActive) {
      const timer = setTimeout(() => {
        setIsToastActive(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isToastActive]);

  // Apply filters based on search or category clicking
  const handleSearch = (query: string, style: string, dates: { start: string; end: string }) => {
    setActiveCategory(style);

    let filtered = INITIAL_DESTINATIONS;

    // Filter by destination name
    if (query.trim()) {
      filtered = filtered.filter(d => 
        d.city.toLowerCase().includes(query.toLowerCase()) || 
        d.country.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by style
    if (style !== 'All Styles') {
      filtered = filtered.filter(d => d.style.toLowerCase() === style.toLowerCase());
    }

    setDestinations(filtered);
    
    // Auto-scroll to selections
    const element = document.getElementById('explore');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }

    // Inform user
    const dateRangeText = dates.start && dates.end ? ` between ${dates.start} and ${dates.end}` : '';
    showToast(`Filtering for destinations in "${query || 'anywhere'}" matching style "${style}"${dateRangeText}.`);
  };

  // Filter selections when category card is clicked
  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    let filtered = INITIAL_DESTINATIONS;

    if (category !== 'All Styles') {
      filtered = filtered.filter(d => d.style.toLowerCase() === category.toLowerCase());
      showToast(`Showing "${category}" destinations.`);
    } else {
      showToast(`Showing all destination selections.`);
    }

    setDestinations(filtered);
    
    // Auto scroll
    const element = document.getElementById('explore');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle saving new or edited trip plans
  const handleSaveTrip = (tripData: Omit<Trip, 'id' | 'image'>) => {
    if (editingTrip) {
      // Update existing trip
      setTrips(prev => prev.map(t => 
        t.id === editingTrip.id 
          ? { ...t, ...tripData } 
          : t
      ));
      showToast(`Itinerary "${tripData.name}" has been successfully updated.`);
      setEditingTrip(null);
    } else {
      // Generate new trip
      const newTripId = `trip-${Date.now()}`;
      
      // Select a random image from list for visual consistency
      const randomImages = [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=80', // Yosemite
        'https://images.unsplash.com/photo-1520116468419-a5240b786687?auto=format&fit=crop&w=500&q=80', // Europe street
        'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=500&q=80'  // temples
      ];
      const randomImg = randomImages[Math.floor(Math.random() * randomImages.length)];

      const newTrip: Trip = {
        id: newTripId,
        image: randomImg,
        ...tripData
      };

      setTrips(prev => [...prev, newTrip]);
      showToast(`Successfully created new trip "${tripData.name}"!`);
    }
  };

  // Action links
  const handlePlanNewTrip = () => {
    setEditingTrip(null);
    setIsDrawerOpen(true);
  };

  const handleContinueTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsDrawerOpen(true);
  };

  const handleDestinationSelect = (dest: Destination) => {
    showToast(`Exploring destination details for ${dest.city}, ${dest.country}. Creating itinerary stops...`);
    // Pre-fill drawer with this stop
    setEditingTrip(null);
    setIsDrawerOpen(true);
    // Simulate setting stopping sequence
    setTimeout(() => {
      const routeInput = document.getElementById('drawer-route') as HTMLTextAreaElement;
      if (routeInput) {
        routeInput.value = `${dest.city}`;
      }
      const nameInput = document.getElementById('drawer-trip-name') as HTMLInputElement;
      if (nameInput) {
        nameInput.value = `Journey to ${dest.city}`;
      }
    }, 100);
  };

  return (
    <>
      {/* Top Navigation */}
      <Navbar 
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          const element = document.getElementById(page);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onPlanTripClick={handlePlanNewTrip}
      />

      {/* Hero Banner Section */}
      <HeroSection 
        onPlanTripClick={handlePlanNewTrip}
        onExploreClick={() => {
          const element = document.getElementById('explore');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Search planning bar overlapping Hero bottom */}
      <TravelSearch onSearch={handleSearch} />

      {/* Main Sections */}
      <main style={{ minHeight: '400px' }}>
        
        {/* Top Regional Selections */}
        <RegionalSelections 
          destinations={destinations}
          onSelectDestination={handleDestinationSelect}
        />

        {/* Previous Trips Section */}
        <PreviousTrips 
          trips={trips}
          onContinueTrip={handleContinueTrip}
          onPlanTripClick={handlePlanNewTrip}
          onClearAll={() => {
            setTrips([]);
            showToast("Cleared mock itineraries. Previous trips empty state displayed.");
          }}
          onRestoreAll={() => {
            setTrips(INITIAL_TRIPS);
            showToast("Restored default mock itineraries.");
          }}
        />

        {/* Quick Plan Trip CTA */}
        <PlanTripCTA onPlanTripClick={handlePlanNewTrip} />

        {/* Optional Category Inspiration Section */}
        <InspirationSection 
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

=======
import Link from "next/link";
import { requireActiveUser } from "@/lib/auth";
import { Nav } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { supabase, user, profile } = await requireActiveUser();
  const { data: trips } = await supabase
    .from("trips")
    .select("trip_id,name,status,start_date,end_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(6);
  const { data: cities } = await supabase
    .from("cities")
    .select("city_id,name,country,popularity_score,cost_index")
    .order("popularity_score", { ascending: false })
    .limit(8);
  const upcoming = (trips ?? []).filter((t) => t.status === "upcoming");
  const recent = (trips ?? []).filter((t) => t.status !== "upcoming");

  return (
    <div className="flex min-h-screen flex-col">
      <Nav profile={profile} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Welcome back, {profile?.first_name ?? "traveler"}!</h1>
          <Link href="/trips/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Plan a new trip</Link>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Upcoming trips</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No upcoming trips. <Link className="underline" href="/trips/new">Create one</Link></p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((t) => (
                <Link key={t.trip_id} href={`/trips/${t.trip_id}`} className="rounded-lg border bg-white p-4">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{t.start_date} – {t.end_date}</p>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs capitalize text-blue-700">{t.status}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Recent trips</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <Link key={t.trip_id} href={`/trips/${t.trip_id}`} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm capitalize text-zinc-500">{t.status}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Popular destinations</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cities?.map((c) => (
              <div key={c.city_id} className="rounded-lg border bg-white p-4">
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{c.country} · Pop {c.popularity_score} · Cost {c.cost_index ?? "—"}</p>
                <Link href={`/cities`} className="mt-2 block text-sm text-blue-600 underline">Explore</Link>
              </div>
            ))}
          </div>
        </section>
>>>>>>> 9d5955245856f1a43f923538317a3db53927ba87
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive planning drawer panel */}
      <PlanTripDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingTrip(null);
        }}
        onSaveTrip={handleSaveTrip}
        editingTrip={editingTrip}
      />

      {/* Elegant Toast notification alert */}
      <div className={`notification-toast ${isToastActive ? 'active' : ''}`} id="app-notification-toast">
        <Bell size={20} className="toast-icon" />
        <span className="toast-message">{toastMessage}</span>
      </div>
    </>
  );
<<<<<<< HEAD
}

export default App;
=======
}
>>>>>>> 9d5955245856f1a43f923538317a3db53927ba87
