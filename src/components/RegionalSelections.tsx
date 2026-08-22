import { MapPin, Calendar, Users } from 'lucide-react';

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
        <h3 className="dest-title">{destination.city} — {destination.style} stop</h3>
        
        <span className="dest-location">
          <MapPin size={10} style={{ color: 'var(--accent-gold)' }} />
          {destination.country}
        </span>
        
        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 8px 0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={11} /> 10 days
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Users size={11} /> 2 people
          </span>
        </div>
        
        <div className="dest-footer">
          <div className="dest-meta">
            <span className="dest-meta-label">Est. Cost</span>
            <span className="dest-meta-value">{destination.cost}</span>
          </div>
          
          <button className="dest-btn" aria-label={`Explore ${destination.city}`}>
            Explore
          </button>
        </div>
      </div>
    </article>
  );
};

export const RegionalSelections: React.FC<RegionalSelectionsProps> = ({ destinations, onSelectDestination }) => {
  return (
    <section className="regions-section container" id="explore">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <span className="eyebrow">Top Regional Selections</span>
          <h2 className="section-title">Popular Destinations</h2>
          <p className="section-desc" style={{ marginBottom: 0 }}>
            Hand-picked curated destinations for your next multi-city journey.
          </p>
        </div>
        <a href="#all-destinations" className="view-all-link" onClick={(e) => { e.preventDefault(); alert("Exploring all regional selections..."); }}>
          View all →
        </a>
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
