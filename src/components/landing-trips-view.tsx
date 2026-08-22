"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Plus,
  Globe,
  Lock,
  Link as LinkIcon,
  Compass,
  ArrowRight,
  X,
  MapPin,
} from "lucide-react";
import type { Tables } from "@/lib/database.types";

type TripRow = Tables<"trips">;

interface RegionItem {
  id: string;
  name: string;
  country: string;
  tag: "India" | "International";
  imageUrl: string;
  description: string;
}

const REGIONS: RegionItem[] = [
  {
    id: "jaipur",
    name: "Jaipur & Rajasthan",
    country: "India",
    tag: "India",
    imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    description: "Royal palaces, majestic forts & vibrant bazaars",
  },
  {
    id: "kerala",
    name: "Kerala Backwaters",
    country: "India",
    tag: "India",
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80",
    description: "Serene houseboat canals & tropical palm groves",
  },
  {
    id: "ladakh",
    name: "Ladakh & Himalayas",
    country: "India",
    tag: "India",
    imageUrl: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=600&q=80",
    description: "High mountain passes, crystal lakes & monasteries",
  },
  {
    id: "goa",
    name: "Goa & Konkan Coast",
    country: "India",
    tag: "India",
    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80",
    description: "Sun-drenched beaches, Portuguese villas & seafood",
  },
  {
    id: "swiss-alps",
    name: "Swiss Alps & Interlaken",
    country: "Switzerland",
    tag: "International",
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80",
    description: "Snow-capped peaks, alpine trains & glacial lakes",
  },
  {
    id: "kyoto",
    name: "Kyoto & Tokyo",
    country: "Japan",
    tag: "International",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
    description: "Ancient zen shrines, neon districts & cherry blossoms",
  },
  {
    id: "amalfi",
    name: "Amalfi Coast",
    country: "Italy",
    tag: "International",
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80",
    description: "Pastel cliffside villages over turquoise Mediterranean waters",
  },
  {
    id: "bali",
    name: "Bali & Ubud",
    country: "Indonesia",
    tag: "International",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
    description: "Emerald rice terraces, spiritual temples & ocean cliffs",
  },
  {
    id: "santorini",
    name: "Santorini & Cyclades",
    country: "Greece",
    tag: "International",
    imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80",
    description: "Iconic blue-domed churches & breathtaking Aegean sunsets",
  },
  {
    id: "paris",
    name: "Paris & French Riviera",
    country: "France",
    tag: "International",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
    description: "World-class art, architecture, cafés & coastal glamour",
  },
];

export function LandingTripsView({
  trips,
  userName,
}: {
  trips: TripRow[];
  userName: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<"all" | "India" | "International">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  // Filtered regions
  const displayedRegions = useMemo(() => {
    if (regionFilter === "all") return REGIONS;
    return REGIONS.filter((r) => r.tag === regionFilter);
  }, [regionFilter]);

  // Filtered and sorted trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((t) => {
        if (filterStatus === "upcoming") {
          return t.status === "upcoming" || t.status === "planning";
        }
        return t.status === filterStatus;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      if (sortBy === "oldest") return dateA - dateB;
      return dateB - dateA;
    });

    return result;
  }, [trips, searchQuery, filterStatus, sortBy]);

  return (
    <div className="space-y-10">
      {/* 1. Large Hero Banner Image */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl border border-teal-900/10 h-72 sm:h-96 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80"
          alt="Travel banner"
          className="h-full w-full object-cover brightness-[0.75]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B4F6C]/90 via-[#0B4F6C]/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
          <div className="flex items-center gap-1.5 rounded-full bg-[#FF5A5F] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm w-fit">
            <Compass className="h-3.5 w-3.5" />
            <span>GlobeTrotter Explorer</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md">
            Welcome back, {userName}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-sky-100 max-w-xl font-medium leading-relaxed drop-shadow">
            Craft multi-city itineraries, discover hidden gems across India & the globe, and collaborate with travel partners seamlessly.
          </p>
        </div>
      </div>

      {/* 2. Interactive Search & Filter Bar */}
      <div className="pacific-card p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trips, destinations, or keywords..."
              className="pacific-input w-full pl-9 pr-8 text-xs font-normal"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {/* Group by / Filter / Sort Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter by Status */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
              <span className="text-[11px] font-bold text-slate-500 pl-1.5 pr-0.5">Status:</span>
              {(["all", "ongoing", "upcoming", "completed"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                    filterStatus === st
                      ? "bg-[#0891B2] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="newest">Newest Date</option>
                <option value="oldest">Oldest Date</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Regional Selections (Horizontally Scrollable) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-teal-900/15 pb-2.5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Top Regional Selections</h2>
            <div className="hidden sm:flex items-center gap-1">
              {(["all", "India", "International"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegionFilter(r)}
                  className={`rounded-full px-3 py-0.5 text-[11px] font-bold transition-colors ${
                    regionFilter === r
                      ? "bg-[#0891B2] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r === "all" ? "All Regions" : r === "India" ? "India" : "International"}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            Scroll to explore <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        {/* Horizontal scroll track */}
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-teal-800/20">
          {displayedRegions.map((region) => (
            <div
              key={region.id}
              className="snap-start shrink-0 w-44 sm:w-52 pacific-card overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={region.imageUrl}
                  alt={region.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute top-2.5 left-2.5 rounded-md bg-[#0B4F6C]/85 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {region.country}
                </span>
              </div>

              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#0891B2] transition-colors line-clamp-1">
                    {region.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-snug">
                    {region.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/trips/new?city_name=${encodeURIComponent(region.name)}`}
                    className="text-[11px] font-bold text-[#FF5A5F] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Plan Trip</span>
                  </Link>
                  <Link
                    href="/cities"
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                  >
                    Guide <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Trips Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-teal-900/15 pb-2.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Your Trips</h2>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-[#0891B2] border border-sky-200">
              {filteredTrips.length} {filteredTrips.length === 1 ? "Trip" : "Trips"}
            </span>
          </div>
          <Link href="/trips" className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1">
            View All in Hub <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-teal-900/20 bg-white p-12 text-center">
            <p className="text-base font-bold text-slate-700">
              {searchQuery || filterStatus !== "all"
                ? "No trips matched your search or filters."
                : "You have not planned any trips yet."}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Start building your multi-destination itinerary with stops, activities, and budget tracking.
            </p>
            <Link
              href="/trips/new"
              className="btn-coral mt-4 inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              Plan a New Trip Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => {
              const visibility = trip.is_public
                ? "public"
                : trip.share_token
                ? "link_only"
                : "private";

              const defaultCover =
                trip.cover_photo_url ||
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

              return (
                <div
                  key={trip.trip_id}
                  className="pacific-card pacific-card-hover overflow-hidden flex flex-col justify-between group"
                >
                  {/* Tall Cover Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={defaultCover}
                      alt={trip.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs capitalize ${
                        trip.status === "ongoing"
                          ? "bg-emerald-600 text-white animate-pulse"
                          : trip.status === "completed"
                          ? "bg-slate-800/90 text-white"
                          : "bg-[#0891B2] text-white"
                      }`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {visibility === "public" ? (
                        <span className="rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-xs border border-emerald-200 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Public
                        </span>
                      ) : visibility === "link_only" ? (
                        <span className="rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-blue-700 shadow-xs border border-blue-200 flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" /> Link Only
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs border border-slate-200 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Private
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors">
                        {trip.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {trip.start_date ?? "Dates TBD"} – {trip.end_date ?? "TBD"}
                      </p>
                      {trip.description ? (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {trip.description}
                        </p>
                      ) : null}
                    </div>

                    {trip.estimated_budget_inr ? (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Budget:</span>
                        <span className="font-bold text-slate-800">
                          ₹{trip.estimated_budget_inr.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Action Bar */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 flex items-center justify-between text-xs">
                    <Link
                      href={`/trips/${trip.trip_id}`}
                      className="font-bold text-[#0891B2] hover:underline flex items-center gap-1"
                    >
                      View Itinerary <ArrowRight className="h-3 w-3" />
                    </Link>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/trips/${trip.trip_id}/build`}
                        className="font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Builder
                      </Link>
                      <Link
                        href={`/trips/${trip.trip_id}/budget`}
                        className="font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Budget
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Sticky Floating Bottom-Right "+ Plan a trip" CTA */}
      <div className="fixed bottom-6 right-6 z-30">
        <Link
          href="/trips/new"
          className="btn-coral flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold shadow-2xl hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4" />
          <span>Plan a trip</span>
        </Link>
      </div>
    </div>
  );
}
