import React from 'react';

const TrendsPanel = ({ trends }) => {
  if (!trends) return null;
  const items = Array.isArray(trends) ? trends : [trends];

  return (
    <div className="card">
      <h3>Trend Predictions</h3>
      <ul style={{ paddingLeft: '1.2rem', marginTop: '1rem' }}>
        {items.slice(0, 12).map((t, idx) => (
          <li key={idx} style={{ marginBottom: '0.75rem' }}>
            {typeof t === 'string' ? t : (t.trend || t.prediction || JSON.stringify(t))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrendsPanel;

