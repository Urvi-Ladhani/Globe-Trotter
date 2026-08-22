import React from 'react';

interface InspirationCategory {
  id: string;
  title: string;
  image: string;
  tripCount: number;
}

interface InspirationSectionProps {
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

export const InspirationSection: React.FC<InspirationSectionProps> = ({ onSelectCategory, activeCategory }) => {
  const categories: InspirationCategory[] = [
    {
      id: 'Adventure',
      title: 'Adventure',
      image: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=300&q=80',
      tripCount: 142
    },
    {
      id: 'Culture',
      title: 'Culture',
      image: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=300&q=80',
      tripCount: 98
    },
    {
      id: 'Food',
      title: 'Food & Dining',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=300&q=80',
      tripCount: 76
    },
    {
      id: 'Luxury',
      title: 'Luxury Stay',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
      tripCount: 54
    },
    {
      id: 'Budget',
      title: 'Backpack & Budget',
      image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=300&q=80',
      tripCount: 110
    }
  ];

  return (
    <section className="inspiration-section" id="inspiration">
      <div className="container">
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <span className="eyebrow">Discover Your Next Destination</span>
          <h2 className="section-title">Inspiration By Travel Style</h2>
          <p className="section-desc" style={{ maxWidth: '600px', margin: '8px auto 0 auto' }}>
            Select a style to filter regional options and uncover journeys tailored to your rhythm.
          </p>
        </div>

        <div className="inspiration-grid">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <div 
                key={cat.id} 
                className="insp-card"
                onClick={() => onSelectCategory(cat.id === activeCategory ? 'All Styles' : cat.id)}
                style={{
                  border: isActive ? '3px solid var(--accent-brown)' : 'none',
                  transform: isActive ? 'scale(1.02)' : 'none'
                }}
                id={`insp-card-${cat.id}`}
              >
                <img 
                  src={cat.image} 
                  alt={cat.title} 
                  className="insp-img"
                  loading="lazy"
                />
                <div className="insp-overlay">
                  <h3 className="insp-title">{cat.title}</h3>
                  <span className="insp-count">{cat.tripCount} itineraries</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
