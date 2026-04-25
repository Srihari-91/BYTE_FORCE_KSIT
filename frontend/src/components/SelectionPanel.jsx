import React from 'react';

const SelectionPanel = ({ selection, papersAnalyzed }) => {
  if (!selection) return null;

  const selected = selection.selected_papers || [];
  const strategy = selection.selection_strategy;

  return (
    <div className="card">
      <h3>Paper Selection (Filter Engine)</h3>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
        Selected {selected.length || '—'} papers{papersAnalyzed ? ` from ${papersAnalyzed} analyzed` : ''}.
      </div>

      {strategy && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Selection strategy</div>
          <div style={{ color: 'var(--text-main)' }}>
            {typeof strategy === 'string' ? strategy : <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(strategy, null, 2)}</pre>}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Selected papers</div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {selected.map((p, idx) => (
              <div key={idx} style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem' }}>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {p.year ? `Year: ${p.year}` : 'Year: —'} · Citations: {p.citationCount ?? '—'} · Velocity: {p.citation_velocity ?? '—'} · Relevance: {p.relevance_score ?? '—'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {p.selection_reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionPanel;

