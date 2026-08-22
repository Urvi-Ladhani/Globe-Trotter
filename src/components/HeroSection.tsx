import React from 'react';
import { Navbar } from './Navbar';

interface HeroSectionProps {
  onPlanTripClick: () => void;
  onExploreClick: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onPlanTripClick, 
  onExploreClick,
  currentPage,
  onNavigate
}) => {
  return (
    <header className="hero-wrapper" id="home">
      {/* Immersive mountain/volcano sunrise background */}
      <img 
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
        alt="Dramatic mountain range sunrise landscape" 
        className="hero-bg"
      />
      <div className="hero-overlay"></div>
      
      {/* Navbar overlaying inside the hero wrapper */}
      <Navbar 
        currentPage={currentPage}
        onNavigate={onNavigate}
        onPlanTripClick={onPlanTripClick}
      />

      <div className="container hero-container">
        <div className="hero-content">
          <span className="eyebrow hero-eyebrow" style={{ color: 'var(--accent-gold)' }}>
            EXPLORE THE WORLD
          </span>
          <h1 className="hero-title">
            HELLO!<br />
            DO YOU WANT TO<br />
            TRAVEL?
          </h1>
          <p className="hero-subtitle">
            Create personalized multi-city trips, discover destinations, build your itinerary and manage your travel budget.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-hero-primary" onClick={onPlanTripClick} id="hero-cta-plan">
              PLAN A TRIP &rarr;
            </button>
            <button className="btn btn-hero-secondary" onClick={onExploreClick} id="hero-cta-explore">
              EXPLORE DESTINATIONS
            </button>
          </div>
        </div>
      </div>

      {/* Slider Indicator Dots */}
      <div className="hero-slider-dots">
        <span className="dot active"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </header>
  );
};
