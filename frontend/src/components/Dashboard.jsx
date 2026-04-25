import React from 'react';

const Dashboard = ({ decision, confidence }) => {
  const getConfidenceClass = (score) => {
    if (score >= 0.8) return 'confidence-high';
    if (score >= 0.5) return 'confidence-med';
    return 'confidence-low';
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Strategic Decision</h2>
        <span className={`confidence-badge ${getConfidenceClass(confidence)}`}>
          Confidence: {Math.round(confidence * 100)}%
        </span>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
        {decision}
      </div>
    </div>
  );
};

export default Dashboard;
