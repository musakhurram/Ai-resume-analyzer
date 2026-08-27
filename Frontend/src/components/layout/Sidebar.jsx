import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router";
import { LogoMark } from "../../shared/components/Logo";
import { getBillingStatus } from "../../features/billing/services/billing.api";
import "./Sidebar.scss";

const navItems = [
  { to: "/analyze/ats-score", alias: ["/analyze/ats-score", "/ats-score", "/ats"], label: "ATS Score Scanner", icon: <svg viewBox="0 0 20 20" fill="none"><path d="M7.5 10.833l1.667 1.667 3.333-3.333" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><rect x="3.333" y="3.333" width="13.334" height="13.334" rx="2.5" stroke="currentColor" strokeWidth="1.6" /></svg> },
  { to: "/new", alias: ["/", "/new", "/app", "/review"], label: "JD Match Review", icon: <svg viewBox="0 0 20 20" fill="none"><path d="M10 4.167v11.666M4.167 10h11.666" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg> },
  { to: "/reports", alias: ["/reports", "/ats/reports", "/reports/"], label: "Past Reviews", icon: <svg viewBox="0 0 20 20" fill="none"><path d="M6.667 3.333H13.333L16.667 6.667V15.833A1.667 1.667 0 0 1 15 17.5H5A1.667 1.667 0 0 1 3.333 15.833V5A1.667 1.667 0 0 1 5 3.333H6.667Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M7.5 10.833h5M7.5 14.167h5M7.5 7.5h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> },
  { to: "/pricing", alias: ["/pricing"], label: "Plans & Billing", icon: <svg viewBox="0 0 20 20" fill="none"><path d="m10 2.8 1.85 4.65 4.95.35-3.78 3.12 1.2 4.78L10 13.05l-4.22 2.65 1.2-4.78L3.2 7.8l4.95-.35L10 2.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg> },
];

const Sidebar = ({ open, onNavigate, onClose }) => {
  const location = useLocation();
  const [billing, setBilling] = useState({ plan: "free", planLabel: "Free", aiTokens: 3000, tokenAllowance: 3000 });

  useEffect(() => {
    let active = true;
    const loadBilling = async () => {
      try { const status = await getBillingStatus(); if (active) setBilling(status); } catch { /* keep fallback */ }
    };
    loadBilling();
    const handleBillingUpdate = () => loadBilling();
    window.addEventListener("billing:updated", handleBillingUpdate);
    return () => { active = false; window.removeEventListener("billing:updated", handleBillingUpdate); };
  }, [location.pathname]);

  const planLabel = billing.planLabel || (billing.plan === "premium" ? "Premium" : billing.plan === "pro" ? "Pro" : "Free");
  const tokens = Math.max(0, Number(billing.aiTokens) || 0);
  const allowance = Math.max(1, Number(billing.tokenAllowance) || (billing.plan === "premium" ? 75000 : billing.plan === "pro" ? 25000 : 3000));
  const percentage = Math.min(100, Math.max(0, (tokens / allowance) * 100));
  const used = Math.max(0, allowance - tokens);
  const tokenLabel = `${tokens.toLocaleString()} AI token${tokens === 1 ? "" : "s"} remaining`;

  return <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Main sidebar">
    <div className="sidebar__header"><Link to="/analyze/ats-score" className="sidebar__brand" onClick={onNavigate}><div className="sidebar__mark"><LogoMark className="sidebar__logo-svg" /></div><div className="sidebar__brand-text"><span className="sidebar__wordmark">Resume Analyzer</span><span className="sidebar__tagline">Interview Studio</span></div></Link>{open && <button type="button" className="sidebar__close-btn" onClick={onClose || onNavigate} aria-label="Close sidebar">×</button>}</div>
    <nav className="sidebar__nav" aria-label="Primary Navigation"><p className="sidebar__section-title">Navigation</p>{navItems.map((item) => { const isActive = item.alias.some((p) => location.pathname === p || (p !== "/" && location.pathname.startsWith(p))); return <NavLink key={item.to} to={item.to} className={`sidebar__link ${isActive ? "is-active" : ""}`} onClick={onNavigate}><span className="sidebar__link-icon">{item.icon}</span><span className="sidebar__link-text">{item.label}</span></NavLink>; })}</nav>
    <div className="sidebar__footer">
      <div className={`sidebar__status-card ${tokens === 0 ? "is-empty" : ""}`}>
        <div className="sidebar__status-header"><span className="sidebar__status-dot" /><span className="sidebar__status-title">{planLabel} Plan</span></div>
        <div className="sidebar__token-row"><p className="sidebar__status-desc">{tokenLabel}</p><span className="sidebar__token-percent">{Math.round(percentage)}%</span></div>
        <div className="sidebar__token-track" role="progressbar" aria-label="AI tokens remaining" aria-valuemin="0" aria-valuemax={allowance} aria-valuenow={tokens}>
          <span className="sidebar__token-fill" style={{ width: `${percentage}%` }} />
        </div>
        <div className="sidebar__token-meta"><span>{used.toLocaleString()} used</span><span>{allowance.toLocaleString()} total</span></div>
        <p className="sidebar__status-meta">{tokens > 0 ? "Available across your AI features" : planLabel === "Free" ? "Your 3,000 free tokens are used. Upgrade to continue." : "Purchase another token pack to continue"}</p>
      </div>
    </div>
  </aside>;
};
export default Sidebar;
