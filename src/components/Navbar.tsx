import React, { useState, useEffect } from 'react';
import { Search, Menu, X, Globe, Calendar, Compass, LogOut, Settings, Briefcase } from 'lucide-react';

interface NavbarProps {
  onPlanTripClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onPlanTripClick, onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', id: 'home', icon: Globe },
    { label: 'Explore', id: 'explore', icon: Compass },
    { label: 'My Trips', id: 'trips', icon: Briefcase },
    { label: 'Calendar', id: 'calendar', icon: Calendar },
  ];

  return (
    <>
      <nav className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          {/* Brand */}
          <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
            GlobeTrotter
          </a>

          {/* Desktop Nav Items */}
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.id} className={`nav-item ${currentPage === item.id ? 'active' : ''}`}>
                <a 
                  href={`#${item.id}`} 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onNavigate(item.id); 
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="nav-item">
              <a href="#about" onClick={(e) => { e.preventDefault(); alert("GlobeTrotter is a premium multi-city travel planning platform designed to make itinerary building, destination exploring, and budgeting seamless."); }}>
                About
              </a>
            </li>
          </ul>

          {/* Desktop Actions */}
          <div className="nav-actions">
            <button className="btn-icon nav-search-btn" aria-label="Search destinations" onClick={() => onNavigate('explore')}>
              <Search size={20} />
            </button>

            {/* Profile Dropdown Toggle */}
            <div style={{ position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="User Profile"
                className="profile-avatar"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              />
              
              {isProfileDropdownOpen && (
                <div className="glass-panel" style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  width: '220px',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 110,
                  color: 'var(--text-primary)'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Elena Rostova</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>elena@globetrotter.io</div>
                  </div>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); onNavigate('trips'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
                    className="btn-icon-text-hover"
                  >
                    <Briefcase size={16} /> My Trips
                  </button>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Opening Profile Settings..."); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
                    className="btn-icon-text-hover"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Signed out successfully."); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', color: 'var(--accent-brown)' }}
                    className="btn-icon-text-hover"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <div 
        className={`mobile-nav-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
          <div>
            <div className="mobile-nav-header">
              <span className="nav-brand" style={{ color: 'var(--text-primary)' }}>GlobeTrotter</span>
              <button onClick={() => setIsMobileMenuOpen(false)} style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <ul className="mobile-nav-links">
              {navItems.map((item) => (
                <li key={item.id} className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}>
                  <a 
                    href={`#${item.id}`} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      onNavigate(item.id); 
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="mobile-nav-item">
                <a 
                  href="#about" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setIsMobileMenuOpen(false); 
                    alert("GlobeTrotter is a premium multi-city travel planning platform designed to make itinerary building, destination exploring, and budgeting seamless."); 
                  }}
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div className="mobile-nav-footer">
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setIsMobileMenuOpen(false); onPlanTripClick(); }}>
              Plan a Trip
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
