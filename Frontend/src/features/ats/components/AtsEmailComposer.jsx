import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { connectGmail, getGmailStatus, generateAtsApplicationEmail } from "../services/ats.api";
import { getBillingStatus } from "../../billing/services/billing.api";
import "./AtsEmailComposer.scss";
import "./AtsEmailComposer.responsive.scss";

const IconMail = ({ size = 17 }) => <svg viewBox="0 0 20 20" fill="none" width={size} height={size} aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="m3.5 5.5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconX = () => <svg viewBox="0 0 20 20" fill="none" width="18" height="18" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
const IconPaperclip = () => <svg viewBox="0 0 20 20" fill="none" width="17" height="17" aria-hidden="true"><path d="m7.2 10.8 4.9-4.9a2.5 2.5 0 1 1 3.5 3.5l-6.7 6.7a4 4 0 0 1-5.7-5.7l6.5-6.5a1.9 1.9 0 0 1 2.7 2.7L6.7 12.3a.9.9 0 0 1-1.3-1.3l5-5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconCheck = () => <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="m5 10.2 3.1 3.1L15.2 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconGoogle = () => <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M21.35 12.2c0-.72-.06-1.25-.2-1.8H12v3.4h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.89-1.74 2.75-4.31 2.75-7.11Z"/><path fill="currentColor" d="M12 21.7c2.7 0 4.97-.89 6.63-2.4l-3.22-2.5c-.89.6-2.03.96-3.41.96-2.61 0-4.83-1.76-5.62-4.13H3.06v2.58A10 10 0 0 0 12 21.7Z"/><path fill="currentColor" d="M6.38 13.63A6.02 6.02 0 0 1 6.07 12c0-.57.1-1.12.31-1.63V7.79H3.06A9.98 9.98 0 0 0 2 12c0 1.61.38 3.13 1.06 4.21l3.32-2.58Z"/><path fill="currentColor" d="M12 6.24c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.97 3.26 14.7 2.3 12 2.3a10 10 0 0 0-8.94 5.49l3.32 2.58C7.17 8 9.39 6.24 12 6.24Z"/></svg>;

const AtsEmailComposer = ({ reportId, candidateName, senderEmail = "", hasRevision = false, onSend, sending = false, error = "", success = "" }) => {
  const [open, setOpen] = useState(false);
  const [sender, setSender] = useState(senderEmail || "");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [attachment, setAttachment] = useState(hasRevision ? "optimized" : "original");
  const [localError, setLocalError] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [aiState, setAiState] = useState({ loading: false, tokens: null, cost: 500 });
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
      setOpen(true); setLocalError("");
    } else if (gmailState === "error") {
      const message = params.get("message");
      window.history.replaceState({}, document.title, window.location.pathname);
      setOpen(true); setLocalError(message || "Unable to connect Gmail. Please try again.");
    }
  }, [senderEmail]);
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setGmail((prev) => ({ ...prev, loading: true }));
    Promise.all([getGmailStatus(), getBillingStatus()])
      .then(([gmailData, billingData]) => {
        if (cancelled) return;
        setGmail({ loading: false, connected: !!gmailData.connected, email: gmailData.email || null });
        setAiState((prev) => ({ ...prev, tokens: Number(billingData?.aiTokens) || 0, cost: Number(billingData?.tokenCosts?.emailApplication) || 500 }));
      })
      .catch(() => { if (!cancelled) setGmail((prev) => ({ ...prev, loading: false })); });
    return () => { cancelled = true; };
  }, [open]);
  useEffect(() => {
    if (candidateName && !message) {
      setSubject(`Application — ${candidateName}`);
      setMessage(`Dear Hiring Manager,\n\nI am writing to express my interest in this opportunity. Please find my resume attached for your consideration.\n\nThank you for your time.\n\nBest regards,\n${candidateName}`);
    }
  }, [candidateName, message]);

  const close = () => { if (!sending && !aiState.loading) { setOpen(false); setLocalError(""); } };
  const handleConnect = () => { setLocalError(""); connectGmail(window.location.pathname); };

  const generateMessage = async () => {
    setLocalError("");
    const available = Number(aiState.tokens);
    const cost = Number(aiState.cost) || 500;
    if (!Number.isFinite(available)) return setLocalError("Checking your AI token balance. Please try again in a moment.");
    if (available < cost) return setLocalError(`Not enough AI tokens. Email generation needs ${cost.toLocaleString()} tokens, but you have ${available.toLocaleString()} remaining.`);
    if (jobDescription.length > 12000) return setLocalError("Job description is too long (maximum 12,000 characters).");
    setAiState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await generateAtsApplicationEmail({ id: reportId, recipientEmail: recipient.trim(), jobTitle: jobTitle.trim(), companyName: companyName.trim(), jobDescription: jobDescription.trim() });
      setSubject(data.subject || "Application");
      setMessage(data.message || "");
      setAiState((prev) => ({ ...prev, loading: false, tokens: Number.isFinite(Number(data.aiTokens)) ? Number(data.aiTokens) : Math.max(0, available - cost) }));
    } catch (err) {
      setAiState((prev) => ({ ...prev, loading: false }));
      setLocalError(err?.response?.data?.message || err?.message || "Unable to generate the application email.");
    }
  };

  const submit = async (event) => {
    event.preventDefault(); setLocalError("");
    if (!gmail.connected) return setLocalError("Connect your Gmail account before sending the resume.");
    if (!sender.trim()) return setLocalError("Your sender email could not be loaded. Please sign in again.");
    if (!recipient.trim()) return setLocalError("Enter the recipient's email address.");
    if (!subject.trim()) return setLocalError("Add a subject before sending.");
    if (message.length > 5000) return setLocalError("Message is too long (maximum 5,000 characters).");
    try { await onSend?.({ id: reportId, senderEmail: sender.trim(), recipient: recipient.trim(), subject: subject.trim(), message: message.trim(), attachment }); } catch { /* parent supplies API error */ }
  };

  const modal = open ? createPortal(
    <div className="ats-email__backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="ats-email__modal" role="dialog" aria-modal="true" aria-labelledby="ats-email-title">
        <div className="ats-email__header">
          <div className="ats-email__header-main"><div className="ats-email__header-icon"><IconMail size={19} /></div><div><span className="ats-email__eyebrow">Resume delivery</span><h3 id="ats-email-title">Send your resume</h3><p>Generate a tailored message and send the PDF from your Gmail.</p></div></div>
          <button type="button" className="ats-email__close" onClick={close} disabled={sending || aiState.loading} aria-label="Close email composer"><IconX /></button>
        </div>
        <form onSubmit={submit} className="ats-email__form">
          <div className={`ats-email__gmail ${gmail.connected ? "is-connected" : ""}`}>
            <div className="ats-email__gmail-icon"><IconGoogle /></div>
            <div className="ats-email__gmail-copy"><strong>{gmail.connected ? "Gmail connected" : "Connect Gmail to send"}</strong><small>{gmail.connected ? `${gmail.email || sender} · Emails will be sent from this Gmail account` : "Required to send from your own Gmail address."}</small></div>
            {gmail.connected ? <span className="ats-email__gmail-status"><IconCheck /> Connected</span> : <button type="button" className="ats-email__gmail-connect" onClick={handleConnect} disabled={gmail.loading}>{gmail.loading ? "Checking…" : "Connect Gmail"}</button>}
          </div>

          <div className="ats-email__fields">
            <label className="ats-email__field"><span>Sender email</span><input type="email" value={sender} readOnly maxLength={254} /><small className="ats-email__field-hint">Your authenticated Gmail sender.</small></label>
            <label className="ats-email__field"><span>Recipient email</span><input type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="recruiter@company.com" maxLength={254} required /></label>
            <div className="ats-email__ai-context">
              <div className="ats-email__section-label"><span>AI application message</span><small>{aiState.tokens == null ? "Checking token balance…" : `${aiState.tokens.toLocaleString()} tokens available · ${aiState.cost.toLocaleString()} tokens per generation`}</small></div>
              <div className="ats-email__ai-grid">
                <label className="ats-email__field"><span>Job title <em>optional</em></span><input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={150} placeholder="Software Engineer" /></label>
                <label className="ats-email__field"><span>Company <em>optional</em></span><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={150} placeholder="Company name" /></label>
              </div>
              <label className="ats-email__field"><span>Job description <em>optional</em></span><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4} maxLength={12000} placeholder="Paste the job description for a more targeted message…" /><small className="ats-email__counter">{jobDescription.length}/12000</small></label>
              <button type="button" className="ats-email__ai-button" onClick={generateMessage} disabled={aiState.loading || aiState.tokens == null || Number(aiState.tokens) < Number(aiState.cost)}>{aiState.loading ? "Generating…" : "Generate with AI"}</button>
            </div>
            <label className="ats-email__field"><span>Subject</span><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required /></label>
            <label className="ats-email__field"><span>Message <em>editable</em></span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} maxLength={5000} placeholder="Generate or write a professional message…" /><small className="ats-email__counter">{message.length}/5000</small></label>
          </div>

          <div className="ats-email__section-label"><span>Attachment</span><small>Choose which resume PDF to send</small></div>
          <div className="ats-email__attachments" role="radiogroup" aria-label="Resume attachment">
            <button type="button" role="radio" aria-checked={attachment === "optimized"} className={`ats-email__attachment-card ${attachment === "optimized" ? "is-selected" : ""} ${!hasRevision ? "is-disabled" : ""}`} onClick={() => hasRevision && setAttachment("optimized")} disabled={!hasRevision}><span className="ats-email__attachment-icon"><IconPaperclip /></span><span className="ats-email__attachment-copy"><strong>AI-optimized resume</strong><small>{hasRevision ? "Your latest AI-improved PDF" : "Generate an AI revision to unlock"}</small></span><span className="ats-email__radio">{attachment === "optimized" && <span />}</span></button>
            <button type="button" role="radio" aria-checked={attachment === "original"} className={`ats-email__attachment-card ${attachment === "original" ? "is-selected" : ""}`} onClick={() => setAttachment("original")}><span className="ats-email__attachment-icon"><IconPaperclip /></span><span className="ats-email__attachment-copy"><strong>Original uploaded resume</strong><small>The resume you originally submitted</small></span><span className="ats-email__radio">{attachment === "original" && <span />}</span></button>
          </div>
          <div className="ats-email__security-note"><IconCheck /><span>Gmail sends the message directly from your connected account. Your Gmail password is never shared with Resume Analyzer.</span></div>
          {(localError || error) && <p className="ats-email__error" role="alert">{localError || error}</p>}
          <div className="ats-email__actions"><button type="button" className="ats-email__cancel" onClick={close} disabled={sending || aiState.loading}>Cancel</button><button type="submit" className="ats-email__send" disabled={sending || !gmail.connected || !message.trim()}>{sending ? <span className="ats-email__spinner" /> : <IconMail size={16} />}{sending ? "Sending…" : "Send resume"}</button></div>
        </form>
      </div>
    </div>, document.body) : null;

  return <div className="ats-email">{successVisible && <div className="ats-email__toast" role="status"><IconCheck /> {success}</div>}<button type="button" className="ats-email__trigger" onClick={() => { setOpen(true); setLocalError(""); }}><IconMail size={16} /> Send resume</button>{modal}</div>;
};

export default AtsEmailComposer;
