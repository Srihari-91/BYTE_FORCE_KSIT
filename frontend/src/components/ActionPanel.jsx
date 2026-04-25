import React from 'react';

const ActionPanel = ({ steps }) => {
  return (
    <div className="card">
      <h3>Actionable Next Steps</h3>
      <ul style={{ paddingLeft: '1.2rem', marginTop: '1rem' }}>
        {steps.map((step, index) => (
          <li key={index} style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActionPanel;
