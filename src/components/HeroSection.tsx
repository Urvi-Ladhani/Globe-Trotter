import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';

interface HeroSectionProps {
  onPlanTripClick: () => void;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPlanTripClick, onExploreClick }) => {
  return (
    <header className="hero-wrapper">
      {/* Immersive background image (Mount Bromo / Earthy premium travel feel) */}
      <img 
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
        alt="Dramatic mountain landscape at sunrise" 
        className="hero-bg"
      />
      <div className="hero-overlay"></div>
      
      <div className="container" style={{ position: 'relative', zIndex: 5 }}>
        <div className="hero-content">
          <span className="eyebrow" style={{ color: 'var(--accent-gold)' }}>
            EXPLORE THE WORLD
          </span>
          <h1 className="hero-title">
            Hello!<br />
            Do you want to travel?
          </h1>
          <p className="hero-subtitle">
            Create personalized multi-city trips, discover amazing destinations, build your itinerary, and keep your entire journey within budget.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={onPlanTripClick} id="hero-cta-plan">
              Plan a Trip <ArrowRight size={18} />
            </button>
            <button className="btn btn-glass" onClick={onExploreClick} id="hero-cta-explore">
              <Compass size={18} /> Explore Destinations
            </button>
          </div>
        </div>
      </div>

      <div className="scroll-indicator">
        <span>Scroll</span>
        <svg width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1V23M6 23L1 18M6 23L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </header>
  );
};
