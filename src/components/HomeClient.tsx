"use client";

import React, { useState, useEffect } from 'react';
import { HeroSection } from './HeroSection';
import { TravelSearch } from './TravelSearch';
import { RegionalSelections } from './RegionalSelections';
import type { Destination } from './RegionalSelections';
import { PreviousTrips } from './PreviousTrips';
import type { Trip } from './PreviousTrips';
import { PlanTripCTA } from './PlanTripCTA';
import { Footer } from './Footer';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface HomeClientProps {
  userProfile: { first_name: string; last_name: string; email: string } | null;
  dbTrips: any[];
  dbCities: any[];
}

export default function HomeClient({ userProfile, dbTrips, dbCities }: HomeClientProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('home');
  
  // Toast Notification states
  const [toastMessage, setToastMessage] = useState('');
  const [isToastActive, setIsToastActive] = useState(false);

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

  // Map Database Cities to Visual Destinations
  const destinations: Destination[] = dbCities.length > 0 
    ? dbCities.map((c) => ({
        id: c.city_id,
        city: c.name,
        country: c.country,
        image: c.image_url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
        tag: c.popularity_score > 70 ? 'Popular' : 'Explore',
        description: c.description || `Discover the culture, history, and beauty of ${c.name} in ${c.country}.`,
        rating: 4.5,
        cost: c.cost_index ? `₹${(c.cost_index * 15000).toLocaleString()}` : '₹35,000',
        style: 'Adventure',
        duration: 'Flexible',
        groupSize: 'Flexible'
      }))
    : [
        {
          id: 'paris',
          city: 'Paris',
          country: 'France',
          image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
          tag: 'Romance / Culture',
          description: 'Explore the iconic Eiffel Tower, Louvre Museum, and enjoy world-class French pastries.',
          rating: 4.8,
          cost: '₹45,000',
          style: 'Luxury',
          duration: '10 days',
          groupSize: '2 people'
        },
        {
          id: 'tokyo',
          city: 'Tokyo',
          country: 'Japan',
          image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80',
          tag: 'Tech / Food',
          description: 'Immerse yourself in neon alleys, visit historic Shinto shrines, and taste fresh sushi.',
          rating: 4.9,
          cost: '₹62,000',
          style: 'Food',
          duration: '7 days',
          groupSize: '2 people'
        },
        {
          id: 'bali',
          city: 'Bali',
          country: 'Indonesia',
          image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
          tag: 'Nature / Beach',
          description: 'Relax in gorgeous volcanic highlands, walk through ancient temples, and surf in clear waters.',
          rating: 4.7,
          cost: '₹24,500',
          style: 'Adventure',
          duration: '10 days',
          groupSize: '2 people'
        }
      ];

  // Map Database Trips to Visual Trips
  const trips: Trip[] = dbTrips.length > 0 
    ? dbTrips.map((t) => {
        // Retrieve stops sorted by order index
        const routeStops = t.trip_stops 
          ? [...t.trip_stops]
              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
              .map((stop: any) => stop.city?.name)
              .filter(Boolean)
          : [];

        const route = routeStops.length > 0 ? routeStops : ['Stops TBD'];
        
        // Format dates
        const formatDate = (dateStr: string) => {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return '';
          const day = d.getDate();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day} ${months[d.getMonth()]}`;
        };

        const dates = t.start_date && t.end_date 
          ? `${formatDate(t.start_date)} — ${formatDate(t.end_date)}`
          : 'Dates Flexible';

        return {
          id: t.trip_id,
          name: t.name,
          route,
          dates,
          destinationsCount: routeStops.length,
          estimatedCost: t.estimated_budget_inr ? `₹${t.estimated_budget_inr.toLocaleString()}` : '₹30,000',
          progress: t.status === 'completed' ? 100 : t.status === 'ongoing' ? 75 : 35,
          image: t.cover_photo_url || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=500&q=80'
        };
      })
    : [];

  const handleSearch = (query: string, style: string, dates: { start: string; end: string }) => {
    showToast(`Searching for trips to "${query || 'anywhere'}"...`);
    router.push(`/trips?search=${encodeURIComponent(query)}`);
  };

  const handlePlanNewTrip = () => {
    if (!userProfile) {
      router.push('/login');
    } else {
      router.push('/trips/new');
    }
  };

  const handleContinueTrip = (trip: Trip) => {
    router.push(`/trips/${trip.id}`);
  };

  const handleDestinationSelect = (dest: Destination) => {
    if (!userProfile) {
      router.push('/login');
    } else {
      router.push(`/trips/new?city_id=${dest.id}`);
    }
  };

  return (
    <>
      {/* Hero Banner Section enclosing Navbar */}
      <HeroSection 
        onPlanTripClick={handlePlanNewTrip}
        onExploreClick={() => {
          const element = document.getElementById('explore');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          const element = document.getElementById(page);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Overlapping search planning bar */}
      <TravelSearch onSearch={handleSearch} />

      {/* Main Page Layout Wrapper */}
      <main className="cream-bg-main">
        
        {/* Popular Destinations Cards */}
        <RegionalSelections 
          destinations={destinations}
          onSelectDestination={handleDestinationSelect}
        />

        {/* Previous Saved Trips */}
        {userProfile && (
          <PreviousTrips 
            trips={trips}
            onContinueTrip={handleContinueTrip}
            onPlanTripClick={handlePlanNewTrip}
            onClearAll={() => {
              showToast("Viewing active trips in dashboard");
              router.push('/trips');
            }}
            onRestoreAll={() => {
              router.push('/trips');
            }}
          />
        )}

        {/* Plan a New Journey CTA banner */}
        <PlanTripCTA onPlanTripClick={handlePlanNewTrip} />

      </main>

      {/* Footer */}
      <Footer />

      {/* Elegant Toast notification alert */}
      <div className={`notification-toast ${isToastActive ? 'active' : ''}`} id="app-notification-toast">
        <Bell size={20} className="toast-icon" />
        <span className="toast-message">{toastMessage}</span>
      </div>
    </>
  );
}
