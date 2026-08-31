import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { connectGmail, getGmailStatus } from "../services/ats.api";
import "./AtsEmailComposer.scss";
import "./AtsEmailComposer.responsive.scss";

const IconMail = ({ size = 17 }) => <svg viewBox="0 0 20 20" fill="none" width={size} height={size} aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="m3.5 5.5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IconX = () => <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
const IconPaperclip = () => <svg viewBox="0 0 20 20" fill="none" width="17" height="17" aria-hidden="true"><path d="m7.2 10.8 4.9-4.9a2.5 2.5 0 1 1 3.5 3.5l-6.7 6.7a4 4 0 0 1-5.7-5.7l6.5-6.5a1.9 1.9 0 0 1 2.7 2.7L6.7 12.3a.9.9 0 0 1-1.3-1.3l5-5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IconCheck = () => <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="m5 10.2 3.1 3.1L15.2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IconGoogle = () => <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M21.35 12.2c0-.72-.06-1.25-.2-1.8H12v3.4h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.89-1.74 2.75-4.31 2.75-7.11Z" /><path fill="currentColor" d="M12 21.7c2.7 0 4.97-.89 6.63-2.4l-3.22-2.5c-.89.6-2.03.96-3.41.96-2.61 0-4.83-1.76-5.62-4.13H3.06v2.58A10 10 0 0 0 12 21.7Z" /><path fill="currentColor" d="M6.38 13.63A6.02 6.02 0 0 1 6.07 12c0-.57.1-1.12.31-1.63V7.79H3.06A9.98 9.98 0 0 0 2 12c0 1.61.38 3.13 1.06 4.21l3.32-2.58Z" /><path fill="currentColor" d="M12 6.24c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.97 3.26 14.7 2.3 12 2.3a10 10 0 0 0-8.94 5.49l3.32 2.58C7.17 8 9.39 6.24 12 6.24Z" /></svg>;

const AtsEmailComposer = ({ reportId, candidateName, senderEmail = "", hasRevision = false, onSend, sending = false, error = "", success = "" }) => {
  const [open, setOpen] = useState(false);
  const [sender, setSender] = useState(senderEmail || "");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(hasRevision ? "optimized" : "original");
  const [localError, setLocalError] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [gmail, setGmail] = useState({ loading: false, connected: false, email: null });

  useEffect(() => setSender(senderEmail || ""), [senderEmail]);
  useEffect(() => setAttachment(hasRevision ? "optimized" : "original"), [hasRevision]);
  useEffect(() => {
    if (!success) return undefined;
    setOpen(false); setRecipient(""); setSuccessVisible(true);
    const timer = window.setTimeout(() => setSuccessVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [success]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailState = params.get("gmail");
    if (gmailState === "connected") {
      window.history.replaceState({}, document.title, window.location.pathname);
      setGmail({ loading: false, connected: true, email: senderEmail || null });
      setOpen(true);
      setLocalError("");
    } else if (gmailState === "error") {
      const message = params.get("message");
      window.history.replaceState({}, document.title, window.location.pathname);
      setOpen(true);
      setLocalError(message || "Unable to connect Gmail. Please try again.");
    }
  }, [senderEmail]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGmail((prev) => ({ ...prev, loading: true }));
    getGmailStatus().then((data) => { if (!cancelled) setGmail({ loading: false, connected: !!data.connected, email: data.email || null }); }).catch(() => { if (!cancelled) setGmail({ loading: false, connected: false, email: null }); });
    return () => { cancelled = true; };
  }, [open]);
  useEffect(() => {
    const name = candidateName || "My Resume";
    setSubject(`Application — ${name}`);
    setMessage(`Hello,\n\nI’m writing to express my interest in opportunities at your organization. Please find my resume attached for your consideration.\n\nI would appreciate the opportunity to discuss how my experience could contribute to your team.\n\nThank you for your time and consideration.\n${candidateName || ""}`.trim());
  }, [candidateName]);

  const close = () => { if (!sending) { setOpen(false); setLocalError(""); } };
  const handleConnect = () => { setLocalError(""); connectGmail(window.location.pathname); };
  const submit = async (event) => {
    event.preventDefault(); setLocalError("");
    if (!gmail.connected) return setLocalError("Connect your Gmail account before sending the resume.");
    if (!sender.trim()) return setLocalError("Your sender email could not be loaded. Please sign in again.");
    if (!recipient.trim()) return setLocalError("Enter the recipient’s email address.");
    if (!subject.trim()) return setLocalError("Add a subject before sending.");
    try { await onSend?.({ id: reportId, senderEmail: sender.trim(), recipient: recipient.trim(), subject: subject.trim(), message: message.trim(), attachment }); } catch { /* parent supplies the API error */ }
  };

  const modal = open ? createPortal(
    <div className="ats-email__backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="ats-email__modal" role="dialog" aria-modal="true" aria-labelledby="ats-email-title">
        <div className="ats-email__header"><div className="ats-email__header-main"><div className="ats-email__header-icon"><IconMail size={19} /></div><div><span className="ats-email__eyebrow">Resume delivery</span><h3 id="ats-email-title">Send your resume</h3><p>Send the PDF directly from your own Gmail account.</p></div></div><button type="button" className="ats-email__close" onClick={close} disabled={sending} aria-label="Close email composer"><IconX /></button></div>
        <form onSubmit={submit} className="ats-email__form">
          <div className={`ats-email__gmail ${gmail.connected ? "is-connected" : ""}`}><div className="ats-email__gmail-icon"><IconGoogle /></div><div className="ats-email__gmail-copy"><strong>{gmail.connected ? "Gmail connected" : "Connect Gmail to send"}</strong><small>{gmail.connected ? `${gmail.email || sender} · Emails will be sent from this Gmail account` : "Required to make your email appear from your own Gmail address."}</small></div>{gmail.connected ? <span className="ats-email__gmail-status"><IconCheck /> Connected</span> : <button type="button" className="ats-email__gmail-connect" onClick={handleConnect} disabled={gmail.loading}>{gmail.loading ? "Checking…" : "Connect Gmail"}</button>}</div>
          <div className="ats-email__fields">
            <label className="ats-email__field"><span>Sender email</span><input type="email" value={sender} placeholder="you@example.com" autoComplete="email" maxLength={254} readOnly /><small className="ats-email__field-hint">Your logged-in email. Gmail authorization is required to send from this address.</small></label>
            <label className="ats-email__field"><span>Recipient email</span><input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="recruiter@company.com" autoComplete="email" maxLength={254} required /></label>
            <label className="ats-email__field"><span>Subject</span><input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={150} required /></label>
            <label className="ats-email__field"><span>Message <em>optional</em></span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} maxLength={5000} placeholder="Write a short professional message…" /><small className="ats-email__counter">{message.length}/5000</small></label>
          </div>
          <div className="ats-email__section-label"><span>Attachment</span><small>Choose which resume PDF to send</small></div>
          <div className="ats-email__attachments" role="radiogroup" aria-label="Resume attachment">
            <button type="button" role="radio" aria-checked={attachment === "optimized"} className={`ats-email__attachment-card ${attachment === "optimized" ? "is-selected" : ""} ${!hasRevision ? "is-disabled" : ""}`} onClick={() => hasRevision && setAttachment("optimized")} disabled={!hasRevision}><span className="ats-email__attachment-icon"><IconPaperclip /></span><span className="ats-email__attachment-copy"><strong>AI-optimized resume</strong><small>{hasRevision ? "Your latest AI-improved PDF" : "Generate an AI revision to unlock"}</small></span><span className="ats-email__radio">{attachment === "optimized" && <span />}</span></button>
            <button type="button" role="radio" aria-checked={attachment === "original"} className={`ats-email__attachment-card ${attachment === "original" ? "is-selected" : ""}`} onClick={() => setAttachment("original")}><span className="ats-email__attachment-icon"><IconPaperclip /></span><span className="ats-email__attachment-copy"><strong>Original uploaded resume</strong><small>The resume you originally submitted</small></span><span className="ats-email__radio">{attachment === "original" && <span />}</span></button>
          </div>
          <div className="ats-email__security-note"><IconCheck /><span>Your resume is sent through Gmail as a PDF attachment. Your Gmail password is never shared with Resume Analyzer.</span></div>
          {(localError || error) && <p className="ats-email__error" role="alert">{localError || error}</p>}
          <div className="ats-email__actions"><button type="button" className="ats-email__cancel" onClick={close} disabled={sending}>Cancel</button><button type="submit" className="ats-email__send" disabled={sending || !gmail.connected}>{sending ? <span className="ats-email__spinner" /> : <IconMail size={16} />}{sending ? "Sending…" : "Send resume"}</button></div>
        </form>
      </div>
    </div>, document.body
  ) : null;

  return <div className="ats-email">{successVisible && <div className="ats-email__success" role="status"><span className="ats-email__success-icon"><IconCheck /></span><span>{success}</span></div>}<button type="button" className="ats-email__trigger" onClick={() => { setLocalError(""); setOpen(true); }} disabled={sending} aria-haspopup="dialog"><span className="ats-email__trigger-icon"><IconMail size={16} /></span><span>Send Resume</span></button>{modal}</div>;
};
export default AtsEmailComposer;
