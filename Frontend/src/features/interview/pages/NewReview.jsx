import { useState } from "react";
import { useNavigate } from "react-router";
import { Field, TextArea } from "../../../shared/components/Field";
import FileDropzone from "../../../shared/components/FileDropzone";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { submitReview } from "../services/interview.api";
import "./NewReview.scss";

const NewReview = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resume, setResume] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = jobDescription.trim().length > 0 && resume && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!jobDescription.trim()) {
      setFormError("Add the job description before running a review.");
      return;
    }
    if (!resume) {
      setFormError("Attach your resume as a PDF before running a review.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitReview({ resume, selfDescription, jobDescription });
      const id = data?.interviewReport?._id;
      if (id) {
        navigate(`/reports/${id}`);
      } else {
        navigate("/reports");
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          err.message ||
          "Couldn't run the review — try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-review">
      <header className="page-header">
        <p className="eyebrow">New submission</p>
        <h1>Open a review</h1>
        <p className="page-header__desc">
          Attach a resume and the job you're targeting. Docket checks the fit, then
          builds a question set and prep plan around what the interviewer is likely
          to probe.
        </p>
      </header>

      {formError && (
        <Callout tone="error" title="Can't run this review yet">
          {formError}
        </Callout>
      )}

      <form className="new-review__form" onSubmit={handleSubmit}>
        <section className="new-review__section">
          <div className="new-review__section-head">
            <span className="new-review__letter">A</span>
            <div>
              <h2>Job description</h2>
              <p>Paste the posting in full — responsibilities and requirements both matter.</p>
            </div>
          </div>
          <Field htmlFor="jobDescription">
            <TextArea
              id="jobDescription"
              name="jobDescription"
              placeholder="Paste the job description here…"
              rows={9}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </Field>
        </section>

        <section className="new-review__section">
          <div className="new-review__section-head">
            <span className="new-review__letter">B</span>
            <div>
              <h2>Resume</h2>
              <p>A single PDF export, up to 3 MB.</p>
            </div>
          </div>
          <FileDropzone file={resume} onChange={setResume} error={fileError} onError={setFileError} />
        </section>

        <section className="new-review__section">
          <div className="new-review__section-head">
            <span className="new-review__letter">C</span>
            <div>
              <h2>About you</h2>
              <p className="new-review__optional">Optional — anything the resume alone won't show.</p>
            </div>
          </div>
          <Field htmlFor="selfDescription">
            <TextArea
              id="selfDescription"
              name="selfDescription"
              placeholder="Career goals, context on a gap, what you're optimizing for in this move…"
              rows={5}
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
            />
          </Field>
        </section>

        <div className="new-review__actions">
          <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
            {submitting ? "Reviewing…" : "Run review"}
          </Button>
          <p className="new-review__note">Usually takes under a minute.</p>
        </div>
      </form>
    </div>
  );
};

export default NewReview;
