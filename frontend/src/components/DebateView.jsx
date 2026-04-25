import React from 'react';

const DebateView = ({ analysis, criticism }) => {
  const renderBlock = (v) => {
    if (!v) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    if (typeof v === 'string') return <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{v}</pre>;
    return <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(v, null, 2)}</pre>;
  };

  return (
    <div className="card">
      <h3>Internal Debate: Analyst vs Critic</h3>
      <div className="debate-view">
        <div className="perspective analyst">
          <h4>Analyst Perspective</h4>
          {renderBlock(analysis)}
        </div>
        <div className="perspective critic">
          <h4>Critic Perspective</h4>
          {renderBlock(criticism)}
        </div>
      </div>
    </div>
  );
};

export default DebateView;
