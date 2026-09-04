import React, { useState } from 'react';
import { MapPinIcon, UsersIcon, SearchIcon, ArrowRightIcon, RouteIcon, ClockIcon } from './Icons';

interface SearchCardProps {
  onSearch?: (from: string, to: string, passengers: number) => void;
}

const SRI_LANKA_CITIES = [
  'Colombo',
  'Kandy',
  'Galle',
  'Matara',
  'Jaffna',
  'Negombo',
  'Kurunegala',
  'Anuradhapura',
  'Nuwara Eliya',
  'Badulla',
  'Trincomalee',
  'Batticaloa',
  'Ratnapura',
  'Gampaha'
];

export const SearchCard: React.FC<SearchCardProps> = ({ onSearch }) => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(fromCity || 'Colombo', toCity || 'Kandy', passengers);
    }
  };

  return (
    <div className="search-card-wrapper">
      <form onSubmit={handleSubmit} className="search-card-form">
        <div className="search-inputs-grid">
          {/* FROM FIELD */}
          <div className="search-input-group">
            <label className="input-label" htmlFor="departure-city">FROM</label>
            <div className="input-field-box">
              <MapPinIcon className="input-icon grey" size={18} color="#94A3B8" />
              <select 
                id="departure-city"
                className="custom-select"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
              >
                <option value="" disabled>Select departure city</option>
                {SRI_LANKA_CITIES.map((city) => (
                  <option key={`from-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TO FIELD */}
          <div className="search-input-group">
            <label className="input-label" htmlFor="destination-city">TO</label>
            <div className="input-field-box">
              <MapPinIcon className="input-icon green" size={18} color="#059669" />
              <select 
                id="destination-city"
                className="custom-select"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              >
                <option value="" disabled>Select destination city</option>
                {SRI_LANKA_CITIES.filter(c => c !== fromCity).map((city) => (
                  <option key={`to-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PASSENGERS FIELD */}
          <div className="search-input-group passengers-group">
            <label className="input-label" htmlFor="passengers-count">PASSENGERS</label>
            <div className="input-field-box">
              <UsersIcon className="input-icon grey" size={18} color="#94A3B8" />
              <select 
                id="passengers-count"
                className="custom-select"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Buses Button */}
        <button type="submit" className="search-submit-btn">
          <SearchIcon size={18} color="#ffffff" />
          <span>Search Buses</span>
          <ArrowRightIcon size={18} color="#ffffff" />
        </button>

        {/* Trust Badges */}
        <div className="trust-badges-row">
          <div className="trust-badge-item">
            <RouteIcon size={15} color="#059669" />
            <span>10+ Routes</span>
          </div>
          <div className="trust-badge-item">
            <ClockIcon size={15} color="#059669" />
            <span>Real-time Seats</span>
          </div>
          <div className="trust-badge-item">
            <UsersIcon size={15} color="#059669" />
            <span>10,000+ Commuters</span>
          </div>
        </div>
      </form>
    </div>
  );
};
