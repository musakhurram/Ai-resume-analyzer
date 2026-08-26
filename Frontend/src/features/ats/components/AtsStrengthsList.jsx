import AtsIcon from "./AtsIcon";

const AtsStrengthsList = ({ strengths = [] }) => {
  if (!strengths || strengths.length === 0) {
    return null;
  }

  return (
    <div className="ats-strengths-card glass-panel">
      <div className="ats-strengths-card__header">
        <span className="ats-strengths-card__icon"><AtsIcon name="checkCircle" size={15} /></span>
        <div>
          <h3 className="ats-strengths-card__title">Identified Resume Strengths</h3>
          <p className="ats-strengths-card__subtitle">Elements already aligned with ATS parsing standards</p>
        </div>
      </div>

      <ul className="ats-strengths-list">
        {strengths.map((str, idx) => (
          <li key={idx} className="ats-strength-item">
            <span className="ats-strength-item__check"><AtsIcon name="checkCircle" size={15} /></span>
            <span className="ats-strength-item__text">{str}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AtsStrengthsList;
