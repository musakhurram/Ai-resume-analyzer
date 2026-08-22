import "./PrepTimeline.scss";

const PrepTimeline = ({ plan = [] }) => {
  if (!plan.length) {
    return <p className="prep-timeline__empty">No preparation plan was generated.</p>;
  }

  const sorted = [...plan].sort((a, b) => a.day - b.day);

  return (
    <ol className="prep-timeline">
      {sorted.map((item, i) => (
        <li key={i} className="prep-timeline__item">
          <div className="prep-timeline__rail" aria-hidden="true">
            <span className="prep-timeline__day">D{item.day}</span>
            <span className="prep-timeline__line" />
          </div>
          <div className="prep-timeline__body">
            <p className="prep-timeline__focus">{item.focus}</p>
            <p className="prep-timeline__tasks">{item.tasks}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

export default PrepTimeline;
