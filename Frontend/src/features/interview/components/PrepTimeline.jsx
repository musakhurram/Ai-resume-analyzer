import { useState } from "react";
import "./PrepTimeline.scss";

const PrepTimeline = ({ plan = [] }) => {
  const [completedDays, setCompletedDays] = useState({});

  if (!plan.length) {
    return <p className="prep-timeline__empty">No preparation plan was generated.</p>;
  }

  const sorted = [...plan].sort((a, b) => a.day - b.day);
  const totalDays = sorted.length;
  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  const toggleDay = (day) => {
    setCompletedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <div className="prep-timeline-container">
      {/* Interactive Progress Meter */}
      <div className="prep-timeline__progress-card">
        <div className="prep-timeline__progress-info">
          <span className="prep-timeline__progress-label">Progress</span>
          <span className="prep-timeline__progress-val">
            {completedCount} of {totalDays} days completed ({progressPercent}%)
          </span>
        </div>
        <div className="prep-timeline__progress-bar">
          <div className="prep-timeline__progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <ol className="prep-timeline">
        {sorted.map((item, i) => {
          const isDone = Boolean(completedDays[item.day]);

          return (
            <li key={i} className={`prep-timeline__item ${isDone ? "is-done" : ""}`}>
              <div className="prep-timeline__rail" aria-hidden="true">
                <span className={`prep-timeline__day ${isDone ? "prep-timeline__day--done" : ""}`}>
                  {isDone ? "✓" : `D${item.day}`}
                </span>
                <span className="prep-timeline__line" />
              </div>
              <div className="prep-timeline__body">
                <div className="prep-timeline__header-row">
                  <p className="prep-timeline__focus">{item.focus}</p>
                  <button
                    type="button"
                    className={`prep-timeline__check-btn ${isDone ? "is-checked" : ""}`}
                    onClick={() => toggleDay(item.day)}
                    title={isDone ? "Mark day as pending" : "Mark day as completed"}
                  >
                    {isDone ? "✓ Done" : "Mark Done"}
                  </button>
                </div>
                <p className="prep-timeline__tasks">{item.tasks}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default PrepTimeline;

