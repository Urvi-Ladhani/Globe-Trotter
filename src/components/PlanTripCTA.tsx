import React from 'react';
import { Plus } from 'lucide-react';

interface PlanTripCTAProps {
  onPlanTripClick: () => void;
}

export const PlanTripCTA: React.FC<PlanTripCTAProps> = ({ onPlanTripClick }) => {
  return (
    <section className="plan-cta-section container" id="plan-cta">
      <div className="plan-cta-card">
        {/* Decorative background travel overlay */}
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80" 
          alt="Road trip adventure background" 
          className="plan-cta-bg"
        />
        
        <div className="plan-cta-content">
          <h2 className="plan-cta-title">Ready for your next adventure?</h2>
          <p className="plan-cta-desc">
            Create a personalized multi-city itinerary, discover local hidden gems, manage your lodging and travel nodes, and plan your budgets dynamically.
          </p>
        </div>
        
        <div className="plan-cta-actions">
          <button className="btn plan-cta-btn" onClick={onPlanTripClick} id="cta-card-plan-btn">
            <Plus size={18} /> Plan a Trip
          </button>
        </div>
      </div>
    </section>
  );
};
