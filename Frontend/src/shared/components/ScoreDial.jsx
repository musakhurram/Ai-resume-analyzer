import "./ScoreDial.scss";

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function bandFor(score) {
  if (score >= 75) return { key: "strong", label: "Strong match" };
  if (score >= 50) return { key: "moderate", label: "Moderate match" };
  return { key: "weak", label: "Needs work" };
}

const ScoreDial = ({ score = 0, size = "lg" }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const band = bandFor(clamped);
  const ticks = Array.from({ length: 24 });

  return (
    <div className={`score-dial score-dial--${size} score-dial--${band.key}`}>
      <svg viewBox="0 0 200 200" className="score-dial__svg" role="img" aria-label={`Match score ${clamped} out of 100 — ${band.label}`}>
        <g className="score-dial__ticks">
          {ticks.map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="10"
              x2="100"
              y2="18"
              transform={`rotate(${(360 / ticks.length) * i} 100 100)`}
            />
          ))}
        </g>
        <circle className="score-dial__track" cx="100" cy="100" r={RADIUS} />
        <circle
          className="score-dial__progress"
          cx="100"
          cy="100"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
        />
        <circle className="score-dial__inner-ring" cx="100" cy="100" r={RADIUS - 16} />
      </svg>
      <div className="score-dial__readout">
        <span className="score-dial__value">{clamped}</span>
        <span className="score-dial__scale">/ 100</span>
      </div>
      <p className="score-dial__label eyebrow">{band.label}</p>
    </div>
  );
};

export default ScoreDial;
