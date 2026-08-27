import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import "./AtsGitDiffComparison.scss";

const SECTIONS = [
  { id: "all", label: "Full rewrite" },
  { id: "summary", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
];

const tokenize = (text = "") => String(text).replace(/\r/g, "").split(/(\s+)/).filter(Boolean);
const normalize = (token = "") => token.toLowerCase().replace(/[^a-z0-9]+/g, "");

function buildWordDiff(before = "", after = "") {
  const a = tokenize(before);
  const b = tokenize(after);
  const maxCells = 180000;
  if (a.length * b.length > maxCells) {
    const beforeWords = new Set(a.map(normalize));
    const afterWords = new Set(b.map(normalize));
    return {
      before: a.map((value) => ({ value, changed: !afterWords.has(normalize(value)) })),
      after: b.map((value) => ({ value, changed: !beforeWords.has(normalize(value)) })),
    };
  }
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = normalize(a[i]) === normalize(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const beforeDiff = [];
  const afterDiff = [];
  let i = 0; let j = 0;
  while (i < a.length && j < b.length) {
    if (normalize(a[i]) === normalize(b[j])) {
      beforeDiff.push({ value: a[i], changed: false }); afterDiff.push({ value: b[j], changed: false }); i += 1; j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      beforeDiff.push({ value: a[i], changed: true }); i += 1;
    } else {
      afterDiff.push({ value: b[j], changed: true }); j += 1;
    }
  }
  while (i < a.length) beforeDiff.push({ value: a[i++], changed: true });
  while (j < b.length) afterDiff.push({ value: b[j++], changed: true });
  return { before: beforeDiff, after: afterDiff };
}

function flattenRevisedResume(resume = {}) {
  const lines = [];
  const contact = resume.contact || {};
  if (contact.fullName) lines.push(contact.fullName);
  const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.website].filter(Boolean).join(" · ");
  if (contactLine) lines.push(contactLine);
  if (resume.summary) lines.push("Professional Summary", resume.summary);
  if (Array.isArray(resume.skills) && resume.skills.length) {
    lines.push("Technical Skills");
    resume.skills.forEach((skill) => lines.push(`${skill.category || "Skills"}: ${Array.isArray(skill.items) ? skill.items.join(", ") : skill.items || ""}`));
  }
  if (Array.isArray(resume.experience) && resume.experience.length) {
    lines.push("Professional Experience");
    resume.experience.forEach((item) => {
      lines.push([item.title, item.company, item.location, item.dates].filter(Boolean).join(" · "));
      (item.bullets || []).forEach((bullet) => lines.push(`• ${bullet}`));
    });
  }
  if (Array.isArray(resume.education) && resume.education.length) {
    lines.push("Education"); resume.education.forEach((item) => lines.push([item.degree, item.institution, item.dates, item.details].filter(Boolean).join(" · ")));
  }
  if (Array.isArray(resume.projects) && resume.projects.length) {
    lines.push("Projects"); resume.projects.forEach((item) => { lines.push([item.name, item.role, item.link].filter(Boolean).join(" · ")); (item.bullets || []).forEach((bullet) => lines.push(`• ${bullet}`)); });
  }
  if (Array.isArray(resume.certifications) && resume.certifications.length) {
    lines.push("Certifications"); resume.certifications.forEach((item) => lines.push([item.name, item.issuer, item.date].filter(Boolean).join(" · ")));
  }
  return lines.filter(Boolean).join("\n");
}

function splitLines(text = "") { return String(text).split(/\n+/).map((line) => line.trim()).filter(Boolean); }

function renderTokens(tokens, side) {
  return tokens.map((token, index) => token.changed ? <mark key={`${side}-${index}`} className={`ats-git-diff__word ats-git-diff__word--${side}`}>{token.value}</mark> : <span key={`${side}-${index}`}>{token.value}</span>);
}

const AtsGitDiffComparison = ({ reportId, originalText, revisedResume, loading, onRevise, onDownload, downloading }) => {
  const [selectedSection, setSelectedSection] = useState("all");
  const [customNotes, setCustomNotes] = useState("");
  const [changedOnly, setChangedOnly] = useState(false);
  const revisedText = useMemo(() => flattenRevisedResume(revisedResume), [revisedResume]);
  const originalLines = useMemo(() => splitLines(originalText), [originalText]);
  const revisedLines = useMemo(() => splitLines(revisedText), [revisedText]);
  const rows = useMemo(() => {
    const count = Math.max(originalLines.length, revisedLines.length);
    return Array.from({ length: count }, (_, index) => {
      const before = originalLines[index] || "";
      const after = revisedLines[index] || "";
      const beforeNo = before.replace(/^•\s*/, "").toLowerCase();
      const afterNo = after.replace(/^•\s*/, "").toLowerCase();
      const changed = beforeNo !== afterNo;
      return { before, after, changed, index };
    }).filter((row) => !changedOnly || row.changed);
  }, [originalLines, revisedLines, changedOnly]);
  const stats = useMemo(() => {
    let additions = 0; let removals = 0; let changed = 0;
    rows.forEach((row) => {
      if (!row.changed) return;
      changed += 1;
      const diff = buildWordDiff(row.before, row.after);
      additions += diff.after.filter((part) => part.changed && part.value.trim()).length;
      removals += diff.before.filter((part) => part.changed && part.value.trim()).length;
    });
    return { additions, removals, changed };
  }, [rows]);

  return <section className="ats-git-diff glass-panel">
    <div className="ats-git-diff__header">
      <div><span className="ats-git-diff__eyebrow">AI REVISION DIFF</span><h2>Review exactly what changed</h2><p>Red shows wording removed from the original. Green shows wording added by the AI.</p></div>
      {revisedResume && <Button variant="primary" size="md" loading={downloading} onClick={() => onDownload(reportId, revisedResume?.contact?.fullName)}>Download ATS PDF</Button>}
    </div>

    <div className="ats-git-diff__controls">
      <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={loading}>{SECTIONS.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}</select>
      <input value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="Optional rewrite focus…" disabled={loading} />
      <Button variant="secondary" size="sm" loading={loading} onClick={() => onRevise({ sections: selectedSection, customNotes })}>{revisedResume ? "Re-generate" : "Generate Revision"}</Button>
    </div>

    {!revisedResume && !loading ? <div className="ats-git-diff__empty">Generate an AI revision to unlock the side-by-side change view.</div> : loading ? <div className="ats-git-diff__empty">Preparing your AI revision and change comparison…</div> : <>
      <div className="ats-git-diff__summary">
        <span className="ats-git-diff__stat ats-git-diff__stat--add">+{stats.additions} additions</span>
        <span className="ats-git-diff__stat ats-git-diff__stat--remove">−{stats.removals} removals</span>
        <span className="ats-git-diff__stat">{stats.changed} changed lines</span>
        <label className="ats-git-diff__toggle"><input type="checkbox" checked={changedOnly} onChange={(e) => setChangedOnly(e.target.checked)} /> Changed only</label>
      </div>
      <div className="ats-git-diff__table" role="region" aria-label="Original and AI revised resume comparison">
        <div className="ats-git-diff__table-head"><div>Original resume</div><div>AI revised resume</div></div>
        {rows.map((row) => {
          const diff = row.changed ? buildWordDiff(row.before, row.after) : { before: tokenize(row.before).map((value) => ({ value, changed: false })), after: tokenize(row.after).map((value) => ({ value, changed: false })) };
          return <div className={`ats-git-diff__row ${row.changed ? "is-changed" : ""}`} key={row.index}>
            <div className={`ats-git-diff__cell ats-git-diff__cell--before ${row.changed ? "is-removed" : ""}`}><span className="ats-git-diff__line">{row.index + 1}</span><div>{renderTokens(diff.before, "before") || <span className="ats-git-diff__blank">—</span>}</div></div>
            <div className={`ats-git-diff__cell ats-git-diff__cell--after ${row.changed ? "is-added" : ""}`}><span className="ats-git-diff__line">{row.index + 1}</span><div>{renderTokens(diff.after, "after") || <span className="ats-git-diff__blank">—</span>}</div></div>
          </div>;
        })}
      </div>
    </>}
  </section>;
};

export default AtsGitDiffComparison;
