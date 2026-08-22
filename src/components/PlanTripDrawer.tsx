import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Trip } from './PreviousTrips';

interface PlanTripDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrip: (tripData: Omit<Trip, 'id' | 'image'>) => void;
  editingTrip?: Trip | null;
}

export const PlanTripDrawer: React.FC<PlanTripDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onSaveTrip,
  editingTrip
}) => {
  const [name, setName] = useState('');
  const [routeText, setRouteText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [progress, setProgress] = useState(15);
  const [style, setStyle] = useState('Adventure');

  // Load existing trip data if in edit / continue mode
  useEffect(() => {
    if (editingTrip) {
      setName(editingTrip.name);
      setRouteText(editingTrip.route.join(' → '));
      setEstimatedCost(editingTrip.estimatedCost);
      setProgress(editingTrip.progress);
      setStartDate('');
      setEndDate('');
    } else {
      // Clear fields
      setName('');
      setRouteText('');
      setStartDate('');
      setEndDate('');
      setEstimatedCost('₹30,000');
      setProgress(15);
      setStyle('Adventure');
    }
  }, [editingTrip, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !routeText) {
      alert("Please fill in the Trip Name and Route stops.");
      return;
    }

    const route = routeText
      .split(/[→,]/)
      .map(city => city.trim())
      .filter(city => city.length > 0);

    const formattedDates = startDate && endDate
      ? `${formatDateString(startDate)} — ${formatDateString(endDate)}`
      : editingTrip ? editingTrip.dates : '24 Sep — 30 Sep';

    onSaveTrip({
      name,
      route,
      dates: formattedDates,
      destinationsCount: route.length,
      estimatedCost: estimatedCost.startsWith('₹') ? estimatedCost : `₹${estimatedCost}`,
      progress: progress
    });
    
    onClose();
  };

  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    return `${day} ${month}`;
  };

  return (
    <div className={`drawer-backdrop ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="plan-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="drawer-header">
          <h3 className="drawer-title">
            {editingTrip ? 'Edit Itinerary Details' : 'Plan a New Journey'}
          </h3>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close itinerary planner">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="drawer-form-container">
          
          {/* Trip Name */}
          <div className="form-group">
            <label htmlFor="drawer-trip-name">Trip Name</label>
            <input 
              id="drawer-trip-name"
              type="text" 
              placeholder="e.g. Europe Escape, Asian Odyssey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Route stops */}
          <div className="form-group">
            <label htmlFor="drawer-route">Route Stop Sequence</label>
            <textarea 
              id="drawer-route"
              placeholder="e.g. Paris, Rome, Venice"
              value={routeText}
              onChange={(e) => setRouteText(e.target.value)}
              rows={3}
              required
            />
            <span className="form-helper-text">
              Separate stops with arrows or commas. Example: Paris → Rome → Venice
            </span>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="drawer-start-date">Start Date</label>
              <input 
                id="drawer-start-date"
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="drawer-end-date">End Date</label>
              <input 
                id="drawer-end-date"
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Budget & Style */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="drawer-budget">Estimated Budget</label>
              <input 
                id="drawer-budget"
                type="text" 
                placeholder="e.g. ₹45,000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="drawer-style">Travel Style</label>
              <select 
                id="drawer-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="Adventure">Adventure</option>
                <option value="Budget">Budget</option>
                <option value="Luxury">Luxury</option>
                <option value="Culture">Culture</option>
                <option value="Food">Food</option>
              </select>
            </div>
          </div>

          {/* Progress Slider */}
          <div className="form-group">
            <label htmlFor="drawer-progress">Itinerary Progress ({progress}%)</label>
            <input 
              id="drawer-progress"
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="progress-range-slider"
            />
          </div>

          {/* Form Actions */}
          <div className="drawer-actions">
            <button type="submit" className="btn btn-form-submit" id="drawer-save-btn">
              {editingTrip ? 'Update Plan' : 'Generate Itinerary'}
            </button>
            <button type="button" className="btn btn-form-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
