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
    e?.preventDefault();
    setLocalError("");

    if (!pastedText.trim() || pastedText.trim().length < 50) {
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
              <span>{wordCount} words {wordCount >= 100 ? "· Great length" : "· Minimum 50 words recommended"}</span>
              {pastedText && (
                <button
                  type="button"
                  className="ats-form__clear-btn"
                  onClick={() => setPastedText("")}
                >
                  Clear text
                </button>
              )}
         {/* Action Bar */}
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
