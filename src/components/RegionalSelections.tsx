import React from 'react';
import { MapPin, Calendar, Users, Image as ImageIcon } from 'lucide-react';

export interface Destination {
  id: string;
  city: string;
  country: string;
  image: string;
  tag: string;
  description: string;
  rating: number;
  cost: string; 
  style: string;
  duration: string;
  groupSize: string;
}

interface RegionalSelectionsProps {
  destinations: Destination[];
  onSelectDestination: (dest: Destination) => void;
}

export const DestinationCard: React.FC<{ destination: Destination; onClick: () => void }> = ({ destination, onClick }) => {
  return (
    <article className="dest-card" onClick={onClick} id={`dest-card-${destination.id}`}>
      <div className="dest-img-container">
        <img 
          src={destination.image} 
          alt={`${destination.city}, ${destination.country}`} 
          className="dest-img"
          loading="lazy"
        />
        {/* Card Badge overlay */}
        <div className="dest-tag-badge">{destination.tag}</div>
      </div>
      
      <div className="dest-info-container">
        <div className="dest-header-row">
          <h3 className="dest-card-title">{destination.city}</h3>
          <span className="dest-country">{destination.country}</span>
        </div>
        
        <p className="dest-desc-text">{destination.description}</p>
        
        <div className="dest-details-row">
          <span className="dest-detail-pill">
            <Calendar size={12} className="dest-detail-icon" />
            {destination.duration}
          </span>
          <span className="dest-detail-pill">
            <Users size={12} className="dest-detail-icon" />
            {destination.groupSize}
          </span>
        </div>

        <div className="dest-card-footer">
          <div className="dest-price-block">
            <span className="dest-price-label">EST. COST</span>
            <span className="dest-price-value">{destination.cost}</span>
          </div>
          
          <button className="btn-dest-explore">
            EXPLORE
          </button>
        </div>
      </div>
    </article>
  );
};

export const RegionalSelections: React.FC<RegionalSelectionsProps> = ({ destinations, onSelectDestination }) => {
  return (
    <section className="regions-section" id="explore">
      <div className="container">
        {/* Section Header */}
        <div className="regions-header-row">
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent-gold)' }}>TOP REGIONAL SELECTIONS</span>
            <h2 className="section-title">Popular Destinations</h2>
          </div>
          <a href="#" className="view-all-link" onClick={(e) => { e.preventDefault(); alert("Exploring all destinations..."); }}>
            View all destinations &rarr;
          </a>
        </div>

        {destinations.length > 0 ? (
          <div className="regions-grid-five">
            {destinations.map((dest) => (
              <DestinationCard 
                key={dest.id} 
                destination={dest} 
                onClick={() => onSelectDestination(dest)} 
              />
            ))}
          </div>
        ) : (
          <div className="no-destinations-fallback">
            <p>No popular destinations found matching your query.</p>
          </div>
        )}
      </div>
    </section>
  );
};
