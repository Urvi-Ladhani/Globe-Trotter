import React, { useState } from 'react';
import { Globe, ArrowRight } from 'lucide-react';

interface FooterProps {
  onSubscribe: (email: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSubscribe(email);
      setEmail('');
    }
  };

  return (
    <footer className="footer-wrapper">
      <div className="container">
        
        {/* Footer Top Grid */}
        <div className="footer-grid">
          {/* Col 1: Brand Info */}
          <div className="footer-info">
            <span className="footer-logo">GlobeTrotter</span>
            <p className="footer-desc">
              Create personalized multi-city trips, build detailed stop-by-stop itineraries, manage budgets, and explore stunning global destinations.
            </p>
            <div className="social-links">
              <a href="#facebook" aria-label="GlobeTrotter Facebook" className="social-icon" onClick={(e) => e.preventDefault()}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a href="#twitter" aria-label="GlobeTrotter Twitter" className="social-icon" onClick={(e) => e.preventDefault()}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#instagram" aria-label="GlobeTrotter Instagram" className="social-icon" onClick={(e) => e.preventDefault()}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#globe" aria-label="GlobeTrotter Community" className="social-icon" onClick={(e) => e.preventDefault()}><Globe size={18} /></a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="footer-col-title">Explore</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => e.preventDefault()}>Destinations</a></li>
              <li><a href="#trips" onClick={(e) => e.preventDefault()}>Popular Routes</a></li>
              <li><a href="#plan-cta" onClick={(e) => e.preventDefault()}>Travel Styles</a></li>
              <li><a href="#inspiration" onClick={(e) => e.preventDefault()}>Curated Guides</a></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links">
              <li><a href="#about" onClick={(e) => e.preventDefault()}>About Us</a></li>
              <li><a href="#careers" onClick={(e) => e.preventDefault()}>Careers</a></li>
              <li><a href="#partner" onClick={(e) => e.preventDefault()}>Partner Portal</a></li>
              <li><a href="#press" onClick={(e) => e.preventDefault()}>Press Room</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="footer-newsletter">
            <h4 className="footer-col-title">Join The Club</h4>
            <p className="newsletter-desc">
              Receive curated travel guides, budget planning tips, and new destination releases directly in your inbox.
            </p>
            <form onSubmit={handleSubmit} className="newsletter-form">
              <input 
                type="email" 
                placeholder="Your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Newsletter email input"
              />
              <button type="submit" className="newsletter-submit-btn" aria-label="Submit newsletter subscription">
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} GlobeTrotter Technologies Inc. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#cookies" onClick={(e) => e.preventDefault()}>Cookie Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
