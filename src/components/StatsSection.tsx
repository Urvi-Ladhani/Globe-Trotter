import React from 'react';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      value: '2 124 000',
      label: 'kilometers',
      sublabel: 'passed by our travelers'
    },
    {
      value: '8 200',
      label: 'travelers',
      sublabel: 'participated in our tours'
    },
    {
      value: '345',
      label: 'positive feedbacks',
      sublabel: 'for all years of the company'
    },
    {
      value: '14',
      label: 'years of work',
      sublabel: 'for your wonderful experiences'
    }
  ];

  return (
    <section className="stats-section container">
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stats-card">
            <div className="stats-value">{stat.value}</div>
            <div className="stats-label">{stat.label}</div>
            <div className="stats-sublabel">{stat.sublabel}</div>
            <div className="stats-divider"></div>
          </div>
        ))}
      </div>
    </section>
  );
};
