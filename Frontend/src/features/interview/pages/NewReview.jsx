import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Field, TextArea } from "../../../shared/components/Field";
import FileDropzone from "../../../shared/components/FileDropzone";
import Button from "../../../shared/components/Button";
import Callout from "../../../shared/components/Callout";
import { submitReview } from "../services/interview.api";
import { rememberResumeName } from "../../../shared/utils/resumeLabel";
import "./NewReview.scss";

const SAMPLE_JDS = [
  {
    title: "Staff Backend Engineer",
    company: "Stripe",
    text: `Job Title: Staff Backend Engineer - Payments Infrastructure
Company: Stripe
Location: Remote / San Francisco, CA

About the Role:
We are looking for a Staff Backend Engineer to architect and scale our core transactional ledger and payment routing engines. You will lead technical designs for systems processing billions of dollars in volume with 99.999% availability.

Responsibilities:
- Design, build, and maintain distributed backend services in Go, Java, and Ruby.
- Implement strict idempotency guarantees, distributed locking, and event-driven architectures.
- Scale our PostgreSQL and distributed database clusters under high write contention.
- Mentor senior engineers and drive technical roadmaps across global engineering orgs.

Requirements:
- 7+ years of backend engineering experience at high scale.
- Deep expertise in distributed consensus, database internals, and concurrency patterns.
- Strong track record of shipping zero-downtime mission-critical systems.
- Superb architectural communication and cross-functional leadership skills.`,
  },
  {
    title: "AI Research Engineer",
    company: "Anthropic",
    text: `Job Title: Senior AI Research & Systems Engineer
Company: Anthropic
Location: San Francisco, CA

About the Role:
We are seeking an experienced AI Systems Engineer to optimize large-scale LLM training pipelines, RLHF alignment infrastructure, and low-latency inference serving.

Responsibilities:
- Write custom GPU kernels in Triton and CUDA for attention and linear algebra operations.
- Scale distributed training workloads across multi-node H100 GPU clusters using PyTorch and Megatron-LM.
- Implement reward modeling, Direct Preference Optimization (DPO), and continuous batching serving layers.
- Profile memory bandwidth, compute arithmetic intensity, and interconnect communication bottlenecks.

Requirements:
- 4+ years of hands-on experience in deep learning systems, PyTorch internals, and GPU programming.
- Familiarity with modern transformer architectures, KV-cache quantization (FP8, AWQ, GPTQ), and flash-attention.
- Strong analytical and problem-solving skills under ambiguous research goals.`,
  },
  {
    title: "Lead Frontend Architect",
    company: "Vercel",
    text: `Job Title: Lead Frontend Architect - Web Platforms
Company: Vercel
Location: Remote / Global

About the Role:
We are looking for a visionary Lead Frontend Architect to design next-generation developer tooling, streaming SSR workflows, and enterprise design systems.

Responsibilities:
- Architect modular web platforms using React 19, Next.js App Router, Server Components, and WebAssembly.
- Pioneer zero-bundle-size client architectures, progressive hydration, and micro-frontend federation.
- Build high-performance developer experiences with sub-millisecond edge rendering.
- Collaborate with product design and engineering leads to set standards across hundreds of components.

Requirements:
- 6+ years of specialized web architecture and deep JavaScript/TypeScript runtime mastery.
- In-depth understanding of browser rendering pipelines, Web Vitals optimization, and bundler compilation (Turbopack, Vite).
- Proven ability to author robust, accessible, and beautifully crafted user experiences.`,
  },
  {
    title: "Principal Fullstack Lead",
    company: "Figma",
    text: `Job Title: Principal Fullstack Systems Lead - Collaborative Canvas
Company: Figma
Location: San Francisco, CA / Remote

About the Role:
Seeking a Principal Fullstack Systems Lead to pioneer real-time multi-user multiplayer canvas architectures, WebGL/WebGPU acceleration, and high-performance collaboration protocols.

Responsibilities:
- Architect high-performance client-server synchronization protocols using WebSockets, WebRTC, and CRDT algorithms.
- Optimize multi-threaded rendering pipelines across WebAssembly (C++/Rust) and TypeScript canvas workers.
- Drive architecture reviews for ultra-low-latency real-time collaboration with sub-16ms frame budget.
- Partner with product design to craft fluid, instant-feel creative software in the browser.

Requirements:
- 8+ years building high-concurrency real-time software, distributed synchronization, or complex browser applications.
- Deep understanding of CRDTs, OT algorithms, memory management, and rendering pipelines.
- Exceptional ability to lead complex cross-cutting technical initiatives.`,
  },
];

const SYNTHESIS_STEPS = [
  "Reading your resume…",
  "Comparing it against the job description…",
  "Identifying likely interview questions…",
  "Building your 7-day preparation plan…",
];

const NewReview = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resume, setResume] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;
  const canSubmit = jobDescription.trim().length > 0 && resume && !submitting;

  // Step cycling animation during submission
  useEffect(() => {
    if (!submitting) {
      setActiveStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % SYNTHESIS_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [submitting]);

  const handleApplyPreset = (presetText) => {
    setJobDescription(presetText);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError("");

    if (!jobDescription.trim()) {
      setFormError("Add the target job description before running a review.");
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
        rememberResumeName(id, resume.name);
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="new-review" onKeyDown={handleKeyDown}>
      {/* Studio Header */}
      <header className="page-header">
        <div className="glow-pill">
          <span className="glow-pill__dot" />
          <span>NEW REVIEW</span>
        </div>
        <h1 className="new-review__title">Start a new review</h1>
        <p className="page-header__desc">
          Add the job description and your PDF resume. We'll score how well they match, flag missing
          skills, predict likely interview questions, and lay out a 7-day preparation plan.
        </p>
      </header>

      {formError && (
        <Callout tone="error" title="Couldn't start the review">
          {formError}
        </Callout>
      )}

      <form className="new-review__form" onSubmit={handleSubmit}>
        {/* Section 1: Job Description */}
        <section className="new-review__section glass-panel">
          <div className="new-review__section-head">
            <span className="new-review__badge-step">01</span>
            <div className="new-review__section-titles">
              <h2>Target Job Description</h2>
              <p>Paste the full job posting—including seniority, responsibilities, and required stack.</p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="new-review__presets-bar">
            <span className="new-review__presets-label">Quick Presets:</span>
            <div className="new-review__presets-list">
              {SAMPLE_JDS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="new-review__preset-btn"
                  onClick={() => handleApplyPreset(preset.text)}
                >
                  <span>{preset.title}</span>
                  <span className="new-review__preset-comp">@{preset.company}</span>
                </button>
              ))}
            </div>
          </div>

          <Field htmlFor="jobDescription">
            <TextArea
              id="jobDescription"
              name="jobDescription"
              placeholder="Paste complete job description requirements here (or select a preset above)…"
              rows={9}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </Field>

          <div className="new-review__field-meta">
            <span className="new-review__counter">
              {wordCount} words {wordCount >= 50 ? "· Good detail" : "· Add at least 50 words for a more accurate review"}
            </span>
            {jobDescription && (
              <button
                type="button"
                className="new-review__clear-btn"
                onClick={() => setJobDescription("")}
              >
                Clear text
              </button>
            )}
          </div>
        </section>

        {/* Section 2: Resume PDF */}
        <section className="new-review__section glass-panel">
          <div className="new-review__section-head">
            <span className="new-review__badge-step">02</span>
            <div className="new-review__section-titles">
              <h2>Candidate Resume PDF</h2>
              <p>Single PDF export (up to 3MB). High-resolution selectable text is recommended.</p>
            </div>
          </div>
          <FileDropzone file={resume} onChange={setResume} error={fileError} onError={setFileError} />
        </section>

        {/* Section 3: About You */}
        <section className="new-review__section glass-panel">
          <div className="new-review__section-head">
            <span className="new-review__badge-step">03</span>
            <div className="new-review__section-titles">
              <h2>About you</h2>
              <p className="new-review__optional">Optional · Explain career pivots, unlisted accomplishments, or specific focus areas.</p>
            </div>
          </div>
          <Field htmlFor="selfDescription">
            <TextArea
              id="selfDescription"
              name="selfDescription"
              placeholder="e.g., Transitioning from backend to AI infrastructure; lead with my high-concurrency distributed systems projects..."
              rows={4}
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
            />
          </Field>
        </section>

        {/* Actions Bar */}
        <div className="new-review__actions-bar glass-panel">
          <div className="new-review__actions-info">
            <span className="new-review__engine-status">
              <span className="new-review__engine-dot" />
              {submitting ? (
                <span className="new-review__synthesis-step">{SYNTHESIS_STEPS[activeStepIdx]}</span>
              ) : (
                "Ready to run"
              )}
            </span>
            <p className="new-review__note">
              {submitting
                ? "Analysis in progress — this usually takes about 15 seconds…"
                : "Tip: Press Ctrl+Enter / ⌘+Enter anytime to run review"}
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={!canSubmit}
            className="new-review__submit-btn"
          >
            {submitting ? "Analyzing…" : "Run review"}
            <svg viewBox="0 0 16 16" fill="none" className="new-review__btn-arrow">
              <path d="M6 3.5 11 8l-5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewReview;


