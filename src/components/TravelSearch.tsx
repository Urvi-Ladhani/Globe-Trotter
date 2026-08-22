import React, { useState } from 'react';
import { Search, Calendar, MapPin, Tag } from 'lucide-react';

interface TravelSearchProps {
  onSearch: (searchQuery: string, style: string, dates: { start: string; end: string }) => void;
}

export const TravelSearch: React.FC<TravelSearchProps> = ({ onSearch }) => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelStyle, setTravelStyle] = useState('All Styles');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(destination, travelStyle, { start: startDate, end: endDate });
  };

  const travelStyles = [
    { value: 'All Styles', label: 'All Styles' },
    { value: 'Budget', label: 'Budget Friendly' },
    { value: 'Adventure', label: 'Adventure / Outdoor' },
    { value: 'Luxury', label: 'Luxury & Comfort' },
    { value: 'Culture', label: 'Cultural & Heritage' },
    { value: 'Food', label: 'Culinary / Foodie' },
  ];

  return (
    <section className="search-section container">
      <form onSubmit={handleSubmit} className="glass-panel search-bar-card" id="travel-search-form">
        
        {/* Destination */}
        <div className="search-field">
          <span className="search-label">Where do you want to go?</span>
          <div className="search-input-wrapper">
            <MapPin size={18} className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Search destinations (e.g. Paris, Tokyo...)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              id="search-dest-input"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="search-field">
          <span className="search-label">Travel dates</span>
          <div className="search-input-wrapper">
            <Calendar size={18} className="search-input-icon" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: '13px' }}
                aria-label="Start date"
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ fontSize: '13px' }}
                aria-label="End date"
              />
            </div>
          </div>
        </div>

        {/* Travel Style */}
        <div className="search-field">
          <span className="search-label">Travel style</span>
          <div className="search-input-wrapper">
            <Tag size={18} className="search-input-icon" />
            <select 
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              id="search-style-select"
            >
              {travelStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="search-submit-btn" id="search-explore-btn">
          <Search size={18} />
          <span>Explore</span>
        </button>

      </form>
    </section>
  );
};
