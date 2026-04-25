import React from 'react';

const GapsPanel = ({ gaps }) => {
  if (!gaps || (Array.isArray(gaps) && gaps.length === 0)) return null;

  const items = Array.isArray(gaps) ? gaps : [gaps];

  return (
    <div className="card">
      <h3>Research Gaps</h3>
      <ul style={{ paddingLeft: '1.2rem', marginTop: '1rem' }}>
        {items.slice(0, 12).map((g, idx) => (
          <li key={idx} style={{ marginBottom: '0.75rem' }}>
            {typeof g === 'string' ? g : (g.gap || JSON.stringify(g))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GapsPanel;

