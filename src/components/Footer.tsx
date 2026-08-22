import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-wrapper">
      <div className="container">
        
        {/* Footer Top Grid */}
        <div className="footer-grid">
          <div className="footer-info">
            <span className="footer-logo">GlobeTrotter</span>
          </div>

          <ul className="footer-links">
            <li><a href="#explore" onClick={(e) => { e.preventDefault(); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore</a></li>
            <li><a href="#trips" onClick={(e) => { e.preventDefault(); document.getElementById('trips')?.scrollIntoView({ behavior: 'smooth' }); }}>My Trips</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); alert("GlobeTrotter is a premium multi-city travel planning platform designed to make itinerary building, destination exploring, and budgeting seamless."); }}>About</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); alert("Contact us at support@globetrotter.io"); }}>Contact</a></li>
          </ul>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© 2026 GlobeTrotter</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
