import { useEffect, useState } from "react";
import "./AtsEmailComposer.scss";

const IconMail = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true">
    <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="m3.5 5.5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true">
    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const AtsEmailComposer = ({
  reportId,
  candidateName,
  hasRevision = false,
  onSend,
  sending = false,
  error = "",
  success = "",
}) => {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(hasRevision ? "optimized" : "original");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const name = candidateName || "My Resume";
    setSubject(`Application — ${name}`);
    setMessage(`Hello,\n\nPlease find my resume attached for your consideration.\n\nThank you,\n${candidateName || ""}`.trim());
  }, [candidateName]);

  useEffect(() => {
    setAttachment(hasRevision ? "optimized" : "original");
  }, [hasRevision]);

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
    if (!recipient.trim()) return setLocalError("Enter the target email address.");
    if (!subject.trim()) return setLocalError("Enter an email subject.");
    try {
      await onSend?.({
        id: reportId,
        recipient: recipient.trim(),
        subject: subject.trim(),
        message: message.trim(),
        attachment,
      });
    } catch {
      // The parent displays the server error; keep the composer open so the user can retry.
    }
  };

  return (
    <div className="ats-email">
      {success && <div className="ats-email__success" role="status">{success}</div>}

      <button type="button" className="ats-email__trigger" onClick={() => setOpen(true)} disabled={sending}>
        <IconMail />
        <span>Send Resume by Email</span>
      </button>

      {open && (
        <div className="ats-email__backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <div className="ats-email__modal" role="dialog" aria-modal="true" aria-labelledby="ats-email-title">
            <div className="ats-email__header">
              <div>
                <span className="ats-email__eyebrow"><IconMail /> Resume delivery</span>
                <h3 id="ats-email-title">Send your resume</h3>
                <p>{hasRevision ? "Choose your resume version and send the PDF directly to a recruiter." : "Your original uploaded resume will be attached. Generate an AI revision to also send the optimized version."}</p>
              </div>
              <button type="button" className="ats-email__close" onClick={close} disabled={sending} aria-label="Close"><IconX /></button>
            </div>

            <form onSubmit={submit} className="ats-email__form">
              <label>
                <span>Target email</span>
                <input
                  type="email"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="recruiter@company.com"
                  autoFocus
                  maxLength={254}
                  required
                />
              </label>

              <label>
                <span>Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={150}
                  required
                />
              </label>

              <label>
                <span>Message <em>optional</em></span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={7}
                  maxLength={5000}
                  placeholder="Write a short professional message…"
                />
              </label>

              <div className="ats-email__attachment">
                <div>
                  <span className="ats-email__attachment-title">Attachment</span>
                  <small>PDF generated from this ATS report</small>
                </div>
                <select value={attachment} onChange={(event) => setAttachment(event.target.value)}>
                  <option value="optimized" disabled={!hasRevision}>AI-optimized resume{!hasRevision ? " (generate revision first)" : ""}</option>
                  <option value="original">Original uploaded resume</option>
                </select>
              </div>

              {(localError || error) && <p className="ats-email__error" role="alert">{localError || error}</p>}

              <div className="ats-email__actions">
                <button type="button" className="ats-email__cancel" onClick={close} disabled={sending}>Cancel</button>
                <button type="submit" className="ats-email__send" disabled={sending}>
                  {sending ? <span className="ats-email__spinner" /> : <IconMail />}
                  {sending ? "Sending…" : "Send with PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtsEmailComposer;
