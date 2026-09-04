import React from 'react';
import { SearchIcon, BusIcon, UsersIcon } from './Icons';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: <SearchIcon size={20} color="#059669" />,
      title: 'Search your route',
      description: 'Enter where you are going and how many seats you need.',
    },
    {
      number: '02',
      icon: <BusIcon size={20} color="#059669" />,
      title: 'Pick your bus',
      description: 'Compare routes, times, fares, and bus types at a glance.',
    },
    {
      number: '03',
      icon: <UsersIcon size={20} color="#059669" />,
      title: 'Book your seat',
      description: 'See the bus layout, choose your seats, and confirm.',
    },
  ];

  return (
    <section className="how-it-works-section">
      <div className="how-it-works-container">
        {/* Section Header */}
        <div className="section-header-center">
          <h2 className="section-main-title">How it works</h2>
          <p className="section-sub-title">Three simple steps to your seat</p>
        </div>

        {/* 3 Step Cards */}
        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-card-top">
                <div className="step-icon-badge">
                  {step.icon}
                </div>
                <span className="step-number-text">{step.number}</span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
