import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-wrapper">
      <div className="container footer-container">
        
        {/* Footer Top Grid */}
        <div className="footer-grid">
          <div className="footer-info">
            <span className="footer-logo">GlobeTrotter</span>
            <p className="footer-tagline">
              Your modern travel companion for planning multi-city itineraries, mapping stops, and managing budgets.
            </p>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-column-title">Explore</h4>
            <ul className="footer-links-list">
              <li><a href="#explore">Destinations</a></li>
              <li><a href="#trips">Travel Plans</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">© 2026 GlobeTrotter. All rights reserved.</p>
          <div className="footer-legal-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
