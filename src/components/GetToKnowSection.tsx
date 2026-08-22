import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const GetToKnowSection: React.FC = () => {
  const hotspots = [
    { name: 'Mount Belukha', top: '35%', left: '42%' },
    { name: 'Lake Teletskoye', top: '55%', left: '60%' },
    { name: 'Multinsky lakes', top: '70%', left: '30%' },
    { name: 'Chulyshman valley', top: '65%', left: '72%' }
  ];

  return (
    <section className="get-to-know-section container">
      <div className="get-to-know-wrapper">
        {/* Scenic Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&q=80" 
          alt="Altai Mountains Scenic View" 
          className="get-to-know-bg"
        />
        <div className="get-to-know-overlay"></div>
        
        {/* Content Info */}
        <div className="get-to-know-content">
          <span className="eyebrow" style={{ color: 'var(--accent-gold)' }}>Get to know</span>
          <h2 className="get-to-know-title">Altai Mountains</h2>
          <p className="get-to-know-desc">
            Two thousand lakes and turbulent rivers, the pure mountain air, majestic peaks and the most beautiful road in the world await you.
          </p>
          <a href="#" className="visit-site-btn" onClick={(e) => { e.preventDefault(); alert("Redirecting to Altai Mountains portal..."); }}>
            <ArrowUpRight size={18} className="visit-site-icon" />
            <span>Visit site</span>
          </a>
        </div>

        {/* Hotspots */}
        <div className="hotspots-container">
          {hotspots.map((spot, idx) => (
            <div 
              key={idx} 
              className="map-hotspot"
              style={{ top: spot.top, left: spot.left }}
            >
              <div className="hotspot-pulse"></div>
              <div className="hotspot-dot"></div>
              <div className="hotspot-tooltip">{spot.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
