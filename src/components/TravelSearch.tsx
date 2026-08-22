import React, { useState } from 'react';
import { Search, Calendar, Briefcase } from 'lucide-react';

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
      <form onSubmit={handleSubmit} className="search-bar-card" id="travel-search-form">
        
        {/* Destination Field */}
        <div className="search-field tour-name-field">
          <div className="search-field-header">
            <Search size={14} className="search-icon" />
            <span className="search-label">WHERE TO?</span>
          </div>
          <input 
            type="text" 
            placeholder="Search destinations"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="search-input-field"
            id="search-dest-input"
          />
        </div>

        <div className="search-divider-vertical"></div>

        {/* Dates Field */}
        <div className="search-field date-range-field">
          <div className="search-field-header">
            <Calendar size={14} className="search-icon" />
            <span className="search-label">TRAVEL DATES</span>
          </div>
          <div className="search-date-inputs">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="search-input-date"
              aria-label="Start date"
            />
            <span className="date-arrow">&rarr;</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="search-input-date"
              aria-label="End date"
            />
          </div>
        </div>

        <div className="search-divider-vertical"></div>

        {/* Travel Style Field */}
        <div className="search-field style-field">
          <div className="search-field-header">
            <Briefcase size={14} className="search-icon" />
            <span className="search-label">TRAVEL STYLE</span>
          </div>
          <select 
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
            className="search-select-field"
            id="search-style-select"
          >
            {travelStyles.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Explore Button */}
        <button type="submit" className="search-submit-btn" id="search-explore-btn">
          EXPLORE
        </button>

      </form>
    </section>
  );
};
