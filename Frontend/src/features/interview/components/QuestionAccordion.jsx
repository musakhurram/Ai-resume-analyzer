import { useState, useRef, useEffect } from "react";
import "./QuestionAccordion.scss";

const QuestionAccordion = ({ questions = [] }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [expandedMap, setExpandedMap] = useState({ 0: true });

  if (!questions.length) {
    return <p className="question-accordion__empty">No questions were generated for this section.</p>;
  }

  const allExpanded = questions.length > 0 && questions.every((_, i) => expandedMap[i]);

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedMap({});
    } else {
      const all = {};
      questions.forEach((_, i) => {
        all[i] = true;
      });
      setExpandedMap(all);
    }
  };

  const handleToggle = (idx) => {
    setExpandedMap((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyQuestion = (e, q, idx) => {
    e.stopPropagation();
    e.preventDefault();
    const text = `Question: ${q.question}\n\nInterviewer Intention: ${q.intention || "N/A"}\n\nTalking Points: ${q.answer || "N/A"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="question-accordion-wrapper">
      <div className="question-accordion-wrapper__toolbar">
        <span className="question-accordion-wrapper__count">
          {questions.length} Question{questions.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className="question-accordion-wrapper__toggle-all-btn"
          onClick={toggleAll}
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div className="question-accordion">
        {questions.map((q, i) => {
          const isOpen = Boolean(expandedMap[i]);

          return (
            <details
              key={i}
              className="question-accordion__item"
              open={isOpen}
              onClick={(e) => {
                e.preventDefault();
                handleToggle(i);
              }}
            >
              <summary>
                <span className="question-accordion__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="question-accordion__question">{q.question}</span>
                <button
                  type="button"
                  className="question-accordion__copy-btn"
                  onClick={(e) => handleCopyQuestion(e, q, i)}
                  title="Copy question and talking points"
                  aria-label="Copy question"
                >
                  {copiedIdx === i ? "✓" : (
                    <svg viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
                <span className="question-accordion__caret" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </summary>
              <div className="question-accordion__panel">
                {q.intention && (
                  <div className="question-accordion__block question-accordion__block--intent">
                    <p className="eyebrow">Why they ask this</p>
                    <p>{q.intention}</p>
                  </div>
                )}
                {q.answer && (
                  <div className="question-accordion__block question-accordion__block--points">
                    <p className="eyebrow">Talking points</p>
                    <p>{q.answer}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionAccordion;


