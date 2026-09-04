import React, { useState } from 'react';
import { BusIcon, ClockIcon, UsersIcon } from './Icons';

export interface BusRoute {
  id: string;
  operator: string;
  busType: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  fareLKR: number;
  availableSeats: number;
  totalSeats: number;
  features: string[];
}

interface BusResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromCity: string;
  toCity: string;
  passengers: number;
  buses?: BusRoute[];
}

export const BusResultsModal: React.FC<BusResultsModalProps> = ({
  isOpen,
  onClose,
  fromCity,
  toCity,
  passengers,
  buses = [],
}) => {
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
  const [bookedSuccess, setBookedSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-route-title">
              <span>{fromCity || 'Colombo'}</span>
              <span className="route-arrow">→</span>
              <span>{toCity || 'Kandy'}</span>
            </div>
            <p className="modal-route-sub">
              {passengers} Passenger{passengers > 1 ? 's' : ''} • Real-time live seat availability
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {bookedSuccess ? (
            <div className="booking-success-view">
              <div className="success-icon-circle">✓</div>
              <h3>Booking Confirmed!</h3>
              <p>Your seats for {selectedBus?.operator} ({fromCity} → {toCity}) have been reserved.</p>
              <div className="ticket-summary-box">
                <p><strong>Route:</strong> {fromCity} to {toCity}</p>
                <p><strong>Bus:</strong> {selectedBus?.busType}</p>
                <p><strong>Departure:</strong> {selectedBus?.departureTime}</p>
                <p><strong>Total Fare:</strong> LKR {(selectedBus?.fareLKR || 0) * passengers}</p>
              </div>
              <button 
                className="primary-action-btn"
                onClick={() => {
                  setBookedSuccess(false);
                  setSelectedBus(null);
                  onClose();
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="bus-list">
              {buses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No active buses found matching your search.
                </div>
              ) : (
                buses.map((bus) => (
                <div key={bus.id} className="bus-result-card">
                  <div className="bus-card-left">
                    <div className="bus-operator-badge">
                      <BusIcon size={18} color="#059669" />
                      <h4>{bus.operator}</h4>
                      <span className="bus-type-tag">{bus.busType}</span>
                    </div>

                    <div className="bus-schedule-row">
                      <div className="schedule-point">
                        <span className="time">{bus.departureTime}</span>
                        <span className="station">{bus.from}</span>
                      </div>
                      <div className="schedule-duration">
                        <ClockIcon size={14} color="#94A3B8" />
                        <span>{bus.duration}</span>
                        <div className="duration-line"></div>
                      </div>
                      <div className="schedule-point">
                        <span className="time">{bus.arrivalTime}</span>
                        <span className="station">{bus.to}</span>
                      </div>
                    </div>

                    <div className="features-tags-row">
                      {bus.features.map((feat, idx) => (
                        <span key={idx} className="feat-chip">{feat}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bus-card-right">
                    <div className="price-tag-group">
                      <span className="price-amount">LKR {bus.fareLKR}</span>
                      <span className="price-sub">/ passenger</span>
                    </div>

                    <div className="seats-avail-tag">
                      <UsersIcon size={14} color="#059669" />
                      <span>{bus.availableSeats} seats left</span>
                    </div>

                    <button 
                      className="book-now-btn"
                      onClick={() => {
                        setSelectedBus(bus);
                        setBookedSuccess(true);
                      }}
                    >
                      Book Seat
                    </button>
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
