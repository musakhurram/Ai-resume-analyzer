import "./QuestionAccordion.scss";

const QuestionAccordion = ({ questions = [] }) => {
  if (!questions.length) {
    return <p className="question-accordion__empty">No questions were generated for this section.</p>;
  }

  return (
    <div className="question-accordion">
      {questions.map((q, i) => (
        <details key={i} className="question-accordion__item">
          <summary>
            <span className="question-accordion__index">{String(i + 1).padStart(2, "0")}</span>
            <span className="question-accordion__question">{q.question}</span>
            <span className="question-accordion__caret" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </summary>
          <div className="question-accordion__panel">
            {q.intention && (
              <div className="question-accordion__block">
                <p className="eyebrow">Why it's asked</p>
                <p>{q.intention}</p>
              </div>
            )}
            {q.answer && (
              <div className="question-accordion__block">
                <p className="eyebrow">Talking points</p>
                <p>{q.answer}</p>
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
};

export default QuestionAccordion;
