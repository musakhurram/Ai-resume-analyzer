import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./AtsEmailComposer.scss";

const IconMail = ({ size = 17 }) => (
  <svg viewBox="0 0 20 20" fill="none" width={size} height={size} aria-hidden="true">
    <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="m3.5 5.5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true">
    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconPaperclip = () => (
  <svg viewBox="0 0 20 20" fill="none" width="17" height="17" aria-hidden="true">
    <path d="m7.2 10.8 4.9-4.9a2.5 2.5 0 1 1 3.5 3.5l-6.7 6.7a4 4 0 0 1-5.7-5.7l6.5-6.5a1.9 1.9 0 0 1 2.7 2.7L6.7 12.3a.9.9 0 0 1-1.3-1.3l5-5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
    <path d="m5 10.2 3.1 3.1L15.2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AtsEmailComposer = ({ reportId, candidateName, hasRevision = false, onSend, sending = false, error = "", success = "" }) => {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(hasRevision ? "optimized" : "original");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const name = candidateName || "My Resume";
    setSubject(`Application — ${name}`);
    setMessage(`Hello,\n\nI’m writing to express my interest in opportunities at your organization. Please find my resume attached for your consideration.\n\nI would appreciate the opportunity to discuss how my experience could contribute to your team.\n\nThank you for your time and consideration.\n${candidateName || ""}`.trim());
  }, [candidateName]);

  useEffect(() => setAttachment(hasRevision ? "optimized" : "original"), [hasRevision]);

  useEffect(() => {
    if (success) {
      setOpen(false);
      setRecipient("");
    }
  }, [success]);

  const close = () => {
    if (!sending) {
      setOpen(false);
      setLocalError("");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (!recipient.trim()) return setLocalError("Enter the recipient’s email address.");
    if (!subject.trim()) return setLocalError("Add a subject before sending.");
    try {
      await onSend?.({ id: reportId, recipient: recipient.trim(), subject: subject.trim(), message: message.trim(), attachment });
    } catch {
      // Parent displays the server error; keep the composer open so the user can retry.
    }
  };

  const modal = open ? createPortal(
    <div className="ats-email__backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="ats-email__modal" role="dialog" aria-modal="true" aria-labelledby="ats-email-title">
        <div className="ats-email__header">
          <div className="ats-email__header-main">
            <div className="ats-email__header-icon"><IconMail size={19} /></div>
            <div>
              <span className="ats-email__eyebrow">Resume delivery</span>
              <h3 id="ats-email-title">Send your resume</h3>
              <p>Send a polished PDF directly to a recruiter or hiring manager.</p>
            </div>
          </div>
          <button type="button" className="ats-email__close" onClick={close} disabled={sending} aria-label="Close email composer"><IconX /></button>
        </div>

        <form onSubmit={submit} className="ats-email__form">
          <div className="ats-email__fields">
            <label className="ats-email__field">
              <span>Recipient email</span>
              <input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="recruiter@company.com" autoFocus maxLength={254} required />
            </label>
            <label className="ats-email__field">
              <span>Subject</span>
              <input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={150} required />
            </label>
            <label className="ats-email__field">
              <span>Message <em>optional</em></span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} maxLength={5000} placeholder="Write a short professional message…" />
              <small className="ats-email__counter">{message.length}/5000</small>
            </label>
          </div>

          <div className="ats-email__section-label"><span>Attachment</span><small>Choose which resume PDF to send</small></div>
          <div className="ats-email__attachments" role="radiogroup" aria-label="Resume attachment">
            <button type="button" role="radio" aria-checked={attachment === "optimized"} className={`ats-email__attachment-card ${attachment === "optimized" ? "is-selected" : ""} ${!hasRevision ? "is-disabled" : ""}`} onClick={() => hasRevision && setAttachment("optimized")} disabled={!hasRevision}>
              <span className="ats-email__attachment-icon"><IconPaperclip /></span>
              <span className="ats-email__attachment-copy"><strong>AI-optimized resume</strong><small>{hasRevision ? "Your latest AI-improved PDF" : "Generate an AI revision to unlock"}</small></span>
              <span className="ats-email__radio">{attachment === "optimized" && <span />}</span>
            </button>
            <button type="button" role="radio" aria-checked={attachment === "original"} className={`ats-email__attachment-card ${attachment === "original" ? "is-selected" : ""}`} onClick={() => setAttachment("original")}>
              <span className="ats-email__attachment-icon"><IconPaperclip /></span>
              <span className="ats-email__attachment-copy"><strong>Original uploaded resume</strong><small>The resume you originally submitted</small></span>
              <span className="ats-email__radio">{attachment === "original" && <span />}</span>
            </button>
          </div>

          <div className="ats-email__security-note"><IconCheck /><span>Your resume is sent as a PDF attachment. Nothing is downloaded to your device first.</span></div>
          {(localError || error) && <p className="ats-email__error" role="alert">{localError || error}</p>}
          <div className="ats-email__actions">
            <button type="button" className="ats-email__cancel" onClick={close} disabled={sending}>Cancel</button>
            <button type="submit" className="ats-email__send" disabled={sending}>{sending ? <span className="ats-email__spinner" /> : <IconMail size={16} />}{sending ? "Sending…" : "Send resume"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="ats-email">
      {success && <div className="ats-email__success" role="status"><span className="ats-email__success-icon"><IconCheck /></span><span>{success}</span></div>}
      <button type="button" className="ats-email__trigger" onClick={() => { setLocalError(""); setOpen(true); }} disabled={sending} aria-haspopup="dialog">
        <span className="ats-email__trigger-icon"><IconMail size={16} /></span><span>Send Resume</span>
      </button>
      {modal}
    </div>
  );
};

export default AtsEmailComposer;
