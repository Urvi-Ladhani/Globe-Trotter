import React from 'react';
import { MapPin, Plus, ArrowRight, Calendar, Bookmark } from 'lucide-react';

export interface Trip {
  id: string;
  name: string;
  route: string[];
  dates: string;
  destinationsCount: number;
  estimatedCost: string;
  progress: number;
  image: string;
}

interface PreviousTripsProps {
  trips: Trip[];
  onContinueTrip: (trip: Trip) => void;
  onPlanTripClick: () => void;
  onClearAll?: () => void;
  onRestoreAll?: () => void;
}

export const TripCard: React.FC<{ trip: Trip; onContinue: () => void }> = ({ trip, onContinue }) => {
  return (
    <article className="trip-card" id={`trip-card-${trip.id}`}>
      <div className="trip-img-wrapper">
        <img 
          src={trip.image} 
          alt={trip.name} 
          className="trip-img"
          loading="lazy"
        />
        <div className="trip-card-overlay"></div>
        <span className="trip-card-badge">IN PROGRESS</span>
      </div>
      
      <div className="trip-card-content">
        <div className="trip-header-row">
          <h3 className="trip-card-title">{trip.name}</h3>
          <span className="trip-card-dates">{trip.dates}</span>
        </div>

        {/* Route Chain */}
        <div className="trip-route-chain">
          {trip.route.join(' • ')}
        </div>

        {/* Info row */}
        <div className="trip-info-row">
          <div className="trip-info-item">
            <span className="trip-info-label">DESTINATIONS</span>
            <span className="trip-info-value">{trip.destinationsCount} stops</span>
          </div>
          <div className="trip-info-item">
            <span className="trip-info-label">EST. BUDGET</span>
            <span className="trip-info-value">{trip.estimatedCost}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="trip-progress-section">
          <div className="trip-progress-header">
            <span className="trip-progress-label">ITINERARY PLANNING</span>
            <span className="trip-progress-pct">{trip.progress}%</span>
          </div>
          <div className="trip-progress-bar-bg">
            <div 
              className="trip-progress-bar-fill" 
              style={{ width: `${trip.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="trip-card-actions">
          <button className="btn-trip-continue" onClick={onContinue} id={`btn-continue-${trip.id}`}>
            CONTINUE &rarr;
          </button>
        </div>
      </div>
    </article>
  );
};

export const PreviousTrips: React.FC<PreviousTripsProps> = ({ 
  trips, 
  onContinueTrip, 
  onPlanTripClick,
  onClearAll,
  onRestoreAll
}) => {
  return (
    <section className="trips-section" id="trips">
      <div className="container">
        
        {/* Header */}
        <div className="trips-header-row">
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent-gold)' }}>PREVIOUS TRIPS</span>
            <h2 className="section-title">Your Travel Plans</h2>
          </div>
          
          <div className="trips-header-actions">
            {trips.length > 0 ? (
              <>
                <button 
                  onClick={onClearAll} 
                  className="btn-clear-state-test"
                  title="Simulate empty state"
                >
                  Clear (Test Empty State)
                </button>
                <a href="#" className="view-all-link" onClick={(e) => { e.preventDefault(); alert("Viewing all saved trips..."); }}>
                  View All Trips &rarr;
                </a>
              </>
            ) : (
              <button 
                onClick={onRestoreAll} 
                className="btn-restore-state-test"
              >
                Restore Mock Trips
              </button>
            )}
          </div>
        </div>

        {/* Trips Display */}
        {trips.length > 0 ? (
          <div className="trips-grid-two">
            {trips.map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onContinue={() => onContinueTrip(trip)} 
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="empty-trips-card" id="trips-empty-state">
            <div className="empty-icon-wrapper">
              <MapPin size={24} />
            </div>
            <h3 className="empty-title">Your next adventure starts here</h3>
            <p className="empty-desc">
              You haven't customized any multi-city itineraries yet. Plan your route, map your stops, and manage your budget in one beautiful place.
            </p>
            <button className="btn btn-empty-cta" onClick={onPlanTripClick} id="btn-empty-plan">
              <Plus size={16} /> Plan Your First Trip
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
