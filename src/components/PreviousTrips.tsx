import React from 'react';
import { MapPin, Plus, ArrowRight } from 'lucide-react';

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
  onClearAll?: () => void; // Provided for testing empty state
  onRestoreAll?: () => void; // Provided for testing empty state
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
        <span className="trip-badge">In Progress</span>
      </div>
      
      <div className="trip-card-content">
        <div className="trip-title-row">
          <h3 className="trip-title">{trip.name}</h3>
          <span className="trip-dates">
            {trip.dates}
          </span>
        </div>

        {/* Route Node Chain */}
        <div style={{ 
          fontFamily: 'var(--font-sans)', 
          fontSize: '13px', 
          fontWeight: 600, 
          color: 'var(--accent-brown)', 
          marginBottom: '16px' 
        }}>
          {trip.route.join(' · ')}
        </div>

        {/* Info Grid */}
        <div className="trip-details-row">
          <div className="detail-item">
            <span className="detail-label">Destinations</span>
            <span className="detail-value">{trip.destinationsCount} stops</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Est. Budget</span>
            <span className="detail-value">{trip.estimatedCost}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span style={{ color: 'var(--text-secondary)' }}>Itinerary Completion</span>
            <span className="progress-pct">{trip.progress}% planned</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${trip.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="trip-actions">
          <button className="btn btn-secondary btn-continue" onClick={onContinue} id={`btn-continue-${trip.id}`}>
            Continue →
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
        <div className="trips-header">
          <div className="trips-header-left">
            <span className="eyebrow">Previous Trips</span>
            <h2 className="section-title">Your Travel Plans</h2>
            <p className="section-desc">
              Continue planning your next adventure or review past trips.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {trips.length > 0 ? (
              <>
                <button 
                  onClick={onClearAll} 
                  style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.7 }}
                  title="Simulate empty state"
                >
                  Clear Trips (Test Empty State)
                </button>
                <a href="#view-all" className="view-all-link" onClick={(e) => { e.preventDefault(); alert("Viewing all saved trips..."); }}>
                  View All Trips <ArrowRight size={14} />
                </a>
              </>
            ) : (
              <button 
                onClick={onRestoreAll} 
                style={{ fontSize: '13px', color: 'var(--accent-brown)', cursor: 'pointer', fontWeight: 500 }}
              >
                Restore Mock Trips
              </button>
            )}
          </div>
        </div>

        {/* Trips Display */}
        {trips.length > 0 ? (
          <div className="trips-grid">
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
              <MapPin size={28} />
            </div>
            <h3 className="empty-title">Your next adventure starts here.</h3>
            <p className="empty-desc">
              You haven't customized any multi-city itineraries yet. Plan your route, map your stops, and manage your budget in one beautiful place.
            </p>
            <button className="btn btn-primary" onClick={onPlanTripClick} id="btn-empty-plan">
              <Plus size={18} /> Plan Your First Trip
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
