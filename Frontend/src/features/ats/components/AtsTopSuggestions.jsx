const PRIORITY_MAP = {
  high: { label: "High Priority", classSuffix: "high" },
  medium: { label: "Medium Priority", classSuffix: "med" },
  low: { label: "Low Priority", classSuffix: "low" },
};

const AtsTopSuggestions = ({ suggestions = [] }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="ats-sugg-empty">
        <p>No critical suggestions flagged.</p>
      </div>
    );
  }

  return (
    <div className="ats-top-suggestions">
      <div className="ats-top-suggestions__list">
        {suggestions.map((item, idx) => {
          const prio = PRIORITY_MAP[item.priority] || PRIORITY_MAP.medium;
          return (
            <div key={idx} className="ats-suggestion-card">
              <div className="ats-suggestion-card__header">
                <div className="ats-suggestion-card__badges">
                  <span className={`ats-prio-badge ats-prio-badge--${prio.classSuffix}`}>
                    {prio.label}
                  </span>
                  {item.section && (
                    <span className="ats-section-tag">
                      {item.section.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="ats-suggestion-card__index">#{idx + 1}</span>
              </div>

              <h4 className="ats-suggestion-card__title">{item.suggestion}</h4>

              {item.reasoning && (
                <div className="ats-suggestion-card__reasoning">
                  <span className="ats-suggestion-card__reasoning-label">Why this matters:</span>
                  <p>{item.reasoning}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AtsTopSuggestions;
