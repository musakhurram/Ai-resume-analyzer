import Badge from "../../../shared/components/Badge";
import "./SkillGapList.scss";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const SEVERITY_WIDTH = { high: "88%", medium: "58%", low: "30%" };

const SkillGapList = ({ gaps = [] }) => {
  if (!gaps.length) {
    return (
      <p className="skill-gap-list__empty">
        No meaningful gaps surfaced — the resume covers what this role asks for.
      </p>
    );
  }

  const sorted = [...gaps].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  );

  return (
    <ul className="skill-gap-list">
      {sorted.map((gap, i) => (
        <li key={i} className="skill-gap-list__item">
          <div className="skill-gap-list__head">
            <span className="skill-gap-list__skill">{gap.skill}</span>
            <Badge tone={gap.severity}>{gap.severity}</Badge>
          </div>
          <div className="skill-gap-list__bar">
            <span
              className={`skill-gap-list__bar-fill skill-gap-list__bar-fill--${gap.severity}`}
              style={{ width: SEVERITY_WIDTH[gap.severity] || "50%" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SkillGapList;
