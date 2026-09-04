import React from 'react';
import { SparklesIcon } from './Icons';
import { SearchCard } from './SearchCard';

interface HeroProps {
  onSearch?: (from: string, to: string, passengers: number) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Top Feature Pill Badge */}
        <div className="hero-badge-pill">
          <SparklesIcon size={15} color="#059669" />
          <span>Sri Lanka's Smart Bus Booking Platform</span>
        </div>

        {/* Main Heading */}
        <h1 className="hero-title">
          Travel smart,
          <br />
          <span className="highlight-green">book your seat</span> ahead.
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          No more waiting in queues or guessing if there's a seat. Search bus routes
          across Sri Lanka, see live seat availability, and reserve your spot in seconds.
        </p>

        {/* Interactive Search Card */}
        <SearchCard onSearch={onSearch} />
      </div>
    </section>
  );
};
