import "./ScoreDial.scss";

const RADIUS = 74;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function bandFor(score) {
  if (score >= 85) return { key: "exceptional", label: "Exceptional Match", tone: "low" };
  if (score >= 70) return { key: "strong", label: "Strong Match", tone: "low" };
  if (score >= 50) return { key: "moderate", label: "Moderate Fit", tone: "medium" };
  return { key: "weak", label: "Needs Development", tone: "high" };
}

const ScoreDial = ({ score = 0, size = "lg", showLabel = true }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const band = bandFor(clamped);

  return (
    <div className={`score-dial score-dial--${size} score-dial--${band.key}`}>
      <div className="score-dial__ring-container">
        <svg
          viewBox="0 0 180 180"
          className="score-dial__svg"
          role="img"
          aria-label={`Match score: ${clamped} percent. Status: ${band.label}`}
        >
          {/* Background track */}
          <circle
            className="score-dial__track"
            cx="90"
            cy="90"
            r={RADIUS}
          />
          {/* Active progress */}
          <circle
            className="score-dial__progress"
            cx="90"
            cy="90"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 90 90)"
          />
        </svg>

        <div className="score-dial__readout">
          <span className="score-dial__value">{clamped}</span>
          <span className="score-dial__percent">%</span>
        </div>
      </div>

      {showLabel && (
        <div className="score-dial__meta">
          <span className="score-dial__badge">
            <span className="score-dial__badge-dot" />
            {band.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default ScoreDial;

