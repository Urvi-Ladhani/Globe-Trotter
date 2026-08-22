import React, { useState, useEffect } from 'react';
import { Menu, X, Settings, LogOut, Briefcase } from 'lucide-react';

interface NavbarProps {
  onPlanTripClick: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  userProfile?: { first_name: string; last_name: string; email: string } | null;
  onLogOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onPlanTripClick, 
  onNavigate, 
  currentPage,
  userProfile = { first_name: 'Elena', last_name: 'Rostova', email: 'elena@globetrotter.io' },
  onLogOut = () => alert('Logging out...')
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    { label: 'Home', id: 'home' },
    { label: 'Explore', id: 'explore' },
    { label: 'My Trips', id: 'trips' },
    { label: 'Calendar', id: 'calendar' },
    { label: 'About', id: 'about' },
  ];

  return (
    <>
      <nav className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          
          {/* Brand - GlobeTrotter */}
          <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
            <span className="nav-brand-text">GlobeTrotter</span>
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
          </ul>

          {/* Desktop Actions */}
          <div className="nav-actions">
            <button className="btn-navbar-action" onClick={onPlanTripClick}>
              PLAN A TRIP
            </button>

            {/* Profile Dropdown Toggle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="User Profile"
                className="profile-avatar"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              />
              
              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <div className="profile-name">{userProfile?.first_name} {userProfile?.last_name}</div>
                    <div className="profile-email">{userProfile?.email}</div>
                  </div>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); onNavigate('trips'); }}
                    className="profile-dropdown-item"
                  >
                    <Briefcase size={14} /> My Trips
                  </button>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Opening Profile Settings..."); }}
                    className="profile-dropdown-item"
                  >
                    <Settings size={14} /> Settings
                  </button>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); onLogOut(); }}
                    className="profile-dropdown-item logout-item"
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Navigation (overlay modal) */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-backdrop active" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="nav-brand-text" style={{ color: 'var(--text-primary)' }}>GlobeTrotter</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="mobile-drawer-close-btn">
                <X size={24} />
              </button>
            </div>
            
            <ul className="mobile-nav-links">
              {navItems.map((item) => (
                <li key={item.id} className="mobile-nav-item">
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
            </ul>

            <div className="mobile-nav-footer">
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setIsMobileMenuOpen(false); onPlanTripClick(); }}>
                Plan a Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
