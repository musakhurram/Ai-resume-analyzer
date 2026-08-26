import { useState, useEffect } from "react";
import { Field, TextArea } from "../../../shared/components/Field";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import AtsIcon from "./AtsIcon";

const ANALYSIS_STEPS = [
  "Extracting resume text & layout tokens…",
  "Evaluating standard section headers & formatting…",
  "Auditing quantified achievements & action verbs…",
  "Checking keyword density & machine parseability…",
  "Compiling prioritized ATS compatibility scorecard…",
];

const AtsUploadForm = ({ onAnalyze, loading, error }) => {
  const [pastedText, setPastedText] = useState("");
  const [localError, setLocalError] = useState("");
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!loading) {
      setStepIdx(0);
      return;
    }

    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 2400);

    return () => clearInterval(timer);
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (pastedText.trim().length < 50) {
      setLocalError("Please paste at least 50 characters of resume text.");
      return;
    }

    onAnalyze({ resumeText: pastedText, fileName: "Pasted-Resume.txt" });
  };

  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
  const canSubmit = !loading && pastedText.trim().length >= 50;

  return (
    <div className="ats-upload-form">
      <header className="page-header">
        <div className="glow-pill">
          <span className="glow-pill__dot" />
          <span>ATS AUDIT</span>
        </div>
        <h1 className="ats-page-title">ATS Resume Analyzer & Fixer</h1>
        <p className="page-header__desc">
          Scan your resume against real Applicant Tracking System (ATS) parsing rules without needing
          a job description. Get deep section feedback, pinpoint parsing bottlenecks, and fix everything
          with factual AI rewriting.
        </p>
      </header>

      {(error || localError) && (
        <Callout tone="error" title="Analysis Error">
          {error || localError}
        </Callout>
      )}

      <form className="ats-form" onSubmit={handleSubmit}>
        <div className="ats-form__panel glass-panel">
          <div className="ats-form__mode-tabs">
            <button
              type="button"
              className="ats-form__mode-btn is-active"
              onClick={() => document.getElementById("pastedResume")?.focus()}
            >
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
                <path
                  d="M13.333 3.333h2.5A1.667 1.667 0 0 1 17.5 5v11.667A1.667 1.667 0 0 1 15.833 18.333H4.167A1.667 1.667 0 0 1 2.5 16.667V5a1.667 1.667 0 0 1 1.667-1.667h2.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <rect x="6.667" y="1.667" width="6.667" height="4.167" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <path d="M6.667 10.833h6.666M6.667 14.167h4.166" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Paste Resume Text
            </button>
          </div>

          <div className="ats-form__paste-wrap">
            <Field htmlFor="pastedResume">
              <TextArea
                id="pastedResume"
                name="pastedResume"
                placeholder="Paste your full resume text here (Contact, Summary, Experience, Education, Skills)…"
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                required
              />
            </Field>
            <div className="ats-form__paste-meta">
              <span>
                {wordCount} words {wordCount >= 100 ? "· Great length" : "· Minimum 50 words recommended"}
              </span>
              {pastedText && (
                <button
                  type="button"
                  className="ats-form__clear-btn"
                  onClick={() => setPastedText("")}
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="ats-form__action-bar glass-panel">
          <div className="ats-form__status-block">
            <span className="ats-form__status-indicator">
              <span className={`ats-form__status-dot ${loading ? "is-pulsing" : ""}`} />
              {loading ? ANALYSIS_STEPS[stepIdx] : "Ready for ATS Analysis"}
            </span>
            <p className="ats-form__status-sub">
              {loading
                ? "Running comprehensive 7-point ATS algorithmic audit…"
                : "Evaluates structure, quantified achievements, keyword strength, and action verbs"}
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={loading}
            disabled={!canSubmit}
            className="ats-form__submit-btn"
          >
            {loading ? "Analyzing Resume…" : "Analyze Resume for ATS"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AtsUploadForm;
