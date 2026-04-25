import React, { useState } from 'react';

const ResultStep = ({ stepNumber, title, summary, fullContent, type = "default" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to convert raw text into bullet points if it's not already an array
  const formatBullets = (content) => {
    if (Array.isArray(content)) return content;
    if (typeof content !== 'string') return [];
    
    // Split by newlines or common bullet point markers
    return content
      .split(/\n|(?:\s*[-•*]\s+)/)
      .filter(line => line.trim().length > 0)
      .slice(0, 3); // Take top 3 for summary
  };

  const bullets = formatBullets(summary);

  return (
    <div className={`card step-card ${type}`}>
      <div className="step-header">
        <span className="step-number">Step {stepNumber}</span>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h3>
      </div>

      <div className="step-summary">
        <ul>
          {bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </div>

      <button 
        className="expand-btn" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show Less' : 'View Full Details'}
      </button>

      {isExpanded && (
        <div className="expanded-content prose">
          {typeof fullContent === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: (fullContent || "").replace(/\n/g, '<br/>') }} />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--text-muted)' }}>
              {JSON.stringify(fullContent, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultStep;
