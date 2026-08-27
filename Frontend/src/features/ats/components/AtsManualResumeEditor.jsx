import { useMemo, useState } from "react";
import { saveAtsManualRevision } from "../services/ats.api";
import "./AtsManualResumeEditor.scss";

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

export default function AtsManualResumeEditor({ reportId, resume, onSaved, onClose }) {
  const [draft, setDraft] = useState(() => clone(resume));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState("summary");

  const tabs = useMemo(() => [
    ["summary", "Summary"],
    ["skills", "Skills"],
    ["experience", "Experience"],
    ["education", "Education"],
    ["projects", "Projects"],
    ["certifications", "Certifications"],
  ].filter(([key]) => Array.isArray(draft[key]) ? draft[key].length : Boolean(draft[key])), [draft]);

  const setContact = (key, value) => setDraft((current) => ({ ...current, contact: { ...(current.contact || {}), [key]: value } }));
  const updateArrayItem = (section, index, patch) => setDraft((current) => ({ ...current, [section]: current[section].map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const updateBullet = (section, index, bulletIndex, value) => setDraft((current) => ({ ...current, [section]: current[section].map((item, i) => i === index ? { ...item, bullets: item.bullets.map((bullet, j) => j === bulletIndex ? value : bullet) } : item) }));

  const save = async () => {
    setSaving(true); setError("");
    try {
      const result = await saveAtsManualRevision(reportId, draft);
      onSaved?.(result.revisedResume || draft);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to save your edits.");
    } finally { setSaving(false); }
  };

  const renderSection = () => {
    if (active === "summary") return <label className="ats-editor-field"><span>Professional Summary</span><textarea rows={8} value={draft.summary || ""} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></label>;
    if (active === "skills") return <div className="ats-editor-list">{(draft.skills || []).map((skill, index) => <div className="ats-editor-card" key={index}><label><span>Category</span><input value={skill.category || ""} onChange={(e) => updateArrayItem("skills", index, { category: e.target.value })} /></label><label><span>Skills</span><textarea rows={3} value={Array.isArray(skill.items) ? skill.items.join(", ") : skill.items || ""} onChange={(e) => updateArrayItem("skills", index, { items: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label></div>)}</div>;
    if (active === "experience") return <div className="ats-editor-list">{(draft.experience || []).map((item, index) => <div className="ats-editor-card" key={index}><div className="ats-editor-row"><label><span>Company</span><input value={item.company || ""} onChange={(e) => updateArrayItem("experience", index, { company: e.target.value })} /></label><label><span>Role</span><input value={item.title || ""} onChange={(e) => updateArrayItem("experience", index, { title: e.target.value })} /></label></div><div className="ats-editor-row"><label><span>Dates</span><input value={item.dates || ""} onChange={(e) => updateArrayItem("experience", index, { dates: e.target.value })} /></label><label><span>Location</span><input value={item.location || ""} onChange={(e) => updateArrayItem("experience", index, { location: e.target.value })} /></label></div><label><span>Bullet points</span><div className="ats-editor-bullets">{(item.bullets || []).map((bullet, bulletIndex) => <textarea key={bulletIndex} rows={2} value={bullet} onChange={(e) => updateBullet("experience", index, bulletIndex, e.target.value)} />)}</div></label></div>)}</div>;
    if (active === "education") return <div className="ats-editor-list">{(draft.education || []).map((item, index) => <div className="ats-editor-card" key={index}><div className="ats-editor-row"><label><span>Degree</span><input value={item.degree || ""} onChange={(e) => updateArrayItem("education", index, { degree: e.target.value })} /></label><label><span>Institution</span><input value={item.institution || ""} onChange={(e) => updateArrayItem("education", index, { institution: e.target.value })} /></label></div><div className="ats-editor-row"><label><span>Dates</span><input value={item.dates || ""} onChange={(e) => updateArrayItem("education", index, { dates: e.target.value })} /></label><label><span>Details</span><input value={item.details || ""} onChange={(e) => updateArrayItem("education", index, { details: e.target.value })} /></label></div></div>)}</div>;
    if (active === "projects") return <div className="ats-editor-list">{(draft.projects || []).map((item, index) => <div className="ats-editor-card" key={index}><div className="ats-editor-row"><label><span>Project</span><input value={item.name || ""} onChange={(e) => updateArrayItem("projects", index, { name: e.target.value })} /></label><label><span>Role</span><input value={item.role || ""} onChange={(e) => updateArrayItem("projects", index, { role: e.target.value })} /></label></div><label><span>Bullet points</span><div className="ats-editor-bullets">{(item.bullets || []).map((bullet, bulletIndex) => <textarea key={bulletIndex} rows={2} value={bullet} onChange={(e) => updateBullet("projects", index, bulletIndex, e.target.value)} />)}</div></label></div>)}</div>;
    return <div className="ats-editor-list">{(draft.certifications || []).map((item, index) => <div className="ats-editor-card" key={index}><div className="ats-editor-row"><label><span>Certification</span><input value={item.name || ""} onChange={(e) => updateArrayItem("certifications", index, { name: e.target.value })} /></label><label><span>Issuer</span><input value={item.issuer || ""} onChange={(e) => updateArrayItem("certifications", index, { issuer: e.target.value })} /></label></div><label><span>Date</span><input value={item.date || ""} onChange={(e) => updateArrayItem("certifications", index, { date: e.target.value })} /></label></div>)}</div>;
  };

  return <div className="ats-editor-backdrop" role="dialog" aria-modal="true" aria-label="Edit ATS resume">
    <div className="ats-editor-modal">
      <header className="ats-editor-header"><div><div className="ats-editor-kicker">MANUAL EDITOR</div><h2>Edit your AI resume</h2><p>Changes are saved to the generated PDF and highlighted against the original.</p></div><button type="button" onClick={onClose} aria-label="Close editor">×</button></header>
      <div className="ats-editor-contact"><strong>{draft.contact?.fullName || "Candidate"}</strong><div><input aria-label="Email" value={draft.contact?.email || ""} onChange={(e) => setContact("email", e.target.value)} placeholder="Email" /><input aria-label="Phone" value={draft.contact?.phone || ""} onChange={(e) => setContact("phone", e.target.value)} placeholder="Phone" /><input aria-label="Location" value={draft.contact?.location || ""} onChange={(e) => setContact("location", e.target.value)} placeholder="Location" /></div></div>
      <nav className="ats-editor-tabs">{tabs.map(([key, label]) => <button key={key} type="button" className={active === key ? "is-active" : ""} onClick={() => setActive(key)}>{label}</button>)}</nav>
      <main className="ats-editor-body">{renderSection()}</main>
      {error && <div className="ats-editor-error">{error}</div>}
      <footer className="ats-editor-footer"><span>PDF will be regenerated at print quality after saving.</span><div><button type="button" className="ats-editor-cancel" onClick={onClose}>Cancel</button><button type="button" className="ats-editor-save" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save & update PDF"}</button></div></footer>
    </div>
  </div>;
}
