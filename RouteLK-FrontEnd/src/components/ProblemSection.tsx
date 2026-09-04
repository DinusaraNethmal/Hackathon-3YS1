import React from 'react';
import { AlertTriangleIcon, BusIcon, UsersIcon } from './Icons';

export const ProblemSection: React.FC = () => {
  return (
    <section className="problem-section">
      <div className="problem-container">
        <div className="problem-card">
          {/* Badge */}
          <div className="problem-badge">
            <AlertTriangleIcon size={16} color="#10B981" />
            <span>THE PROBLEM</span>
          </div>

          {/* Heading */}
          <h2 className="problem-title">
            Sri Lanka's daily commute shouldn't be this hard.
          </h2>

          {/* Body Paragraph */}
          <p className="problem-description">
            Every day, millions of Sri Lankans rely on public buses to get to work, school, and home. But the
            experience is broken: long queues at busy terminals, no way to know if a seat is available before you
            board, unpredictable schedules, and confusion about fares. Commuters waste time and energy every
            single day — simply trying to get from point A to point B.
          </p>

          {/* 3 Problem Cards Grid */}
          <div className="problem-grid">
            {/* Card 1 */}
            <div className="problem-grid-item">
              <div className="problem-icon-wrapper">
                <BusIcon size={20} color="#10B981" />
              </div>
              <h3 className="problem-item-title">No seat certainty</h3>
              <p className="problem-item-desc">
                You board not knowing if you will stand for an hour.
              </p>
            </div>

            {/* Card 2 */}
            <div className="problem-grid-item">
              <div className="problem-icon-wrapper">
                <AlertTriangleIcon size={20} color="#10B981" />
              </div>
              <h3 className="problem-item-title">Unpredictable waits</h3>
              <p className="problem-item-desc">
                No live info on when the next bus actually arrives.
              </p>
            </div>

            {/* Card 3 */}
            <div className="problem-grid-item">
              <div className="problem-icon-wrapper">
                <UsersIcon size={20} color="#10B981" />
              </div>
              <h3 className="problem-item-title">Confusing fares</h3>
              <p className="problem-item-desc">
                Prices vary by route, type, and operator with no clarity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
