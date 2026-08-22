import React from 'react';
import { Star, MapPin } from 'lucide-react';

export interface Destination {
  id: string;
  city: string;
  country: string;
  image: string;
  tag: string;
  description: string;
  rating: number;
  cost: string; // $, $$, $$$
  style: string; // Budget, Adventure, Luxury, Culture, Food
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
        <div className="dest-gradient"></div>
      </div>
      
      <div className="dest-info-overlay">
        <span className="dest-tag">{destination.tag}</span>
        <h3 className="dest-title">{destination.city}</h3>
        <span className="dest-location">
          <MapPin size={12} style={{ color: 'var(--accent-gold)' }} />
          {destination.country}
        </span>
        
        <p className="dest-desc">
          {destination.description}
        </p>
        
        <div className="dest-footer">
          <div className="dest-meta">
            <span className="dest-meta-label">Style / Cost</span>
            <span className="dest-meta-value">{destination.style} • {destination.cost}</span>
          </div>
          
          <div className="dest-meta" style={{ alignItems: 'flex-end' }}>
            <span className="dest-meta-label">Rating</span>
            <span className="dest-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Star size={12} fill="currentColor" style={{ color: 'var(--accent-gold)' }} />
              {destination.rating}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export const RegionalSelections: React.FC<RegionalSelectionsProps> = ({ destinations, onSelectDestination }) => {
  return (
    <section className="regions-section container" id="explore">
      <div style={{ marginBottom: '32px' }}>
        <span className="eyebrow">Top Regional Selections</span>
        <h2 className="section-title">Popular Destinations</h2>
        <p className="section-desc" style={{ marginBottom: 0 }}>
          Hand-picked curated destinations for your next multi-city journey.
        </p>
      </div>

      {destinations.length > 0 ? (
        <div className="regions-grid">
          {destinations.map((dest) => (
            <DestinationCard 
              key={dest.id} 
              destination={dest} 
              onClick={() => onSelectDestination(dest)} 
            />
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 24px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: '16px', 
          color: 'var(--text-secondary)' 
        }}>
          <p style={{ fontSize: '15px' }}>No destinations match your search criteria. Try a different term or style.</p>
        </div>
      )}
    </section>
  );
};
