import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { confirmCheckoutSession, createCheckoutSession, getBillingStatus } from "../services/billing.api";
import "./Pricing.scss";

const PLANS = [
  { id: "free", name: "Free", price: "$0", period: "forever", tokens: 3000, description: "A clean starting point for trying the complete Resume Analyzer workflow.", features: ["3,000 AI tokens", "ATS compatibility analysis", "JD match review", "Past reports saved to your account"] },
  { id: "pro", name: "Pro", price: "$9.99", period: "one-time", tokens: 25000, description: "More room for regular applications, resume revisions, and interview preparation.", features: ["25,000 AI tokens", "ATS compatibility analysis", "JD match review", "AI resume optimization", "ATS-optimized PDF generation"], popular: true },
  { id: "premium", name: "Premium", price: "$19.99", period: "one-time", tokens: 75000, description: "The largest token balance for intensive applications and frequent iterations.", features: ["75,000 AI tokens", "ATS compatibility analysis", "JD match review", "AI resume optimization", "ATS-optimized PDF generation", "Extensive interview preparation"] },
];

const formatTokens = (value) => Number(value || 0).toLocaleString();

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState("");
  const checkoutState = searchParams.get("checkout");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    let active = true;
    async function loadBilling() {
      setBillingLoading(true);
      try {
        if (checkoutState === "success" && sessionId) {
          setConfirming(true);
          const result = await confirmCheckoutSession(sessionId);
          if (active) { setBilling(result); setPaymentConfirmed(Boolean(result.confirmed)); window.dispatchEvent(new Event("billing:updated")); }
        } else {
          const status = await getBillingStatus();
          if (active) setBilling(status);
        }
      } catch (err) {
        if (active) { setPaymentConfirmed(false); setError(err.response?.data?.message || "Unable to load your token balance. Please refresh in a moment."); }
      } finally { if (active) { setConfirming(false); setBillingLoading(false); } }
    }
    loadBilling();
    return () => { active = false; };
  }, [checkoutState, sessionId]);

  const handlePurchase = async (plan) => {
    if (plan === "free") return;
    setError(""); setLoadingPlan(plan);
    try { const data = await createCheckoutSession(plan); window.location.assign(data.url); }
    catch (err) { setError(err.response?.data?.message || "Unable to start checkout. Please try again."); setLoadingPlan(""); }
  };

  const planId = billing?.plan || "free";
  const currentPlan = PLANS.find((plan) => plan.id === planId) || PLANS[0];
  const currentAllowance = Number(billing?.planTokens) || currentPlan.tokens;
  const hasBalance = Number.isFinite(Number(billing?.aiTokens));
  const tokenBalance = hasBalance ? Math.max(0, Number(billing.aiTokens)) : 0;
  const usagePercent = hasBalance && currentAllowance > 0 ? Math.min(100, Math.round((tokenBalance / currentAllowance) * 100)) : 0;

  return <div className="pricing-page">
    <header className="pricing-hero">
      <div className="pricing-hero__copy"><span className="pricing-page__eyebrow">Plans & Billing</span><h1>Simple plans.<br /><span>More room to apply.</span></h1><p>Choose a token balance that fits your job search. Use your tokens across Resume Analyzer's AI features instead of paying separately for every action.</p></div>
      <div className="pricing-balance-card">
        <div className="pricing-balance-card__top"><span className="pricing-balance-card__label">CURRENT BALANCE</span><span className="pricing-balance-card__plan">{billing?.planLabel || "—"}</span></div>
        <div className="pricing-balance-card__number">{billingLoading ? "…" : hasBalance ? formatTokens(tokenBalance) : "—"} <small>tokens</small></div>
        <div className="pricing-balance-card__track" aria-label={hasBalance ? `${usagePercent}% of plan tokens remaining` : "Token balance unavailable"}><span style={{ width: `${usagePercent}%` }} /></div>
        <div className="pricing-balance-card__bottom"><span>{billingLoading ? "Checking balance" : hasBalance ? `${usagePercent}% remaining` : "Balance unavailable"}</span><span>{hasBalance ? `${formatTokens(Math.max(0, currentAllowance - tokenBalance))} used` : "—"}</span></div>
      </div>
    </header>

    {checkoutState === "success" && <div className="pricing-page__notice pricing-page__notice--success"><span className="pricing-page__notice-icon">✓</span><span>{confirming ? "Confirming your payment…" : paymentConfirmed ? `${billing?.planLabel || "Plan"} activated. ${formatTokens(billing?.aiTokens)} AI tokens are now available.` : "Payment is still processing. Your token balance will update once Stripe confirms it."}</span></div>}
    {checkoutState === "cancelled" && <div className="pricing-page__notice"><span className="pricing-page__notice-icon">×</span><span>Checkout was cancelled. No charge was made.</span></div>}

    <section className="pricing-section">
      <div className="pricing-section__heading"><div><span className="pricing-section__eyebrow">CHOOSE YOUR PLAN</span><h2>Pick your level of AI access</h2></div><span className="pricing-section__hint">All plans use the same AI features</span></div>
      <div className="pricing-grid">{PLANS.map((plan) => {
        const isCurrent = billing?.plan === plan.id;
        const isFree = plan.id === "free";
        const isLoading = loadingPlan === plan.id;
        const valuePerDollar = plan.price === "$0" ? "Starter access" : `${formatTokens(plan.tokens / Number(plan.price.slice(1)))} tokens / $1`;
        return <article key={plan.id} className={`pricing-card ${plan.popular ? "pricing-card--popular" : ""} ${isCurrent ? "pricing-card--current" : ""}`}>
          {plan.popular && <div className="pricing-card__popular"><span>Recommended</span><i /></div>}
          <div className="pricing-card__heading"><div><span className="pricing-card__label">{plan.name}</span><div className="pricing-card__token-title"><strong>{formatTokens(plan.tokens)}</strong><span>AI tokens</span></div></div><div className="pricing-card__price"><strong>{plan.price}</strong><span>{plan.period}</span></div></div>
          <p className="pricing-card__description">{plan.description}</p><div className="pricing-card__value"><span>{valuePerDollar}</span>{isCurrent && <b>YOUR PLAN</b>}</div><div className="pricing-card__divider" /><p className="pricing-card__includes">Everything you need</p>
          <ul className="pricing-card__features">{plan.features.map((feature) => <li key={feature}><span className="pricing-card__check">✓</span><span>{feature}</span></li>)}</ul>
          <button type="button" className={`pricing-card__button ${isCurrent ? "pricing-card__button--current" : ""}`} onClick={() => handlePurchase(plan.id)} disabled={isFree || Boolean(loadingPlan) || confirming}>{isFree && isCurrent ? "Current Free Plan" : isCurrent ? `Buy More ${plan.name} Tokens` : isLoading ? "Opening checkout…" : `Choose ${plan.name}`}</button>
        </article>;
      })}</div>
    </section>

    <section className="token-guide"><div className="token-guide__intro"><span className="pricing-section__eyebrow">HOW TOKENS WORK</span><h2>One balance. Every AI feature.</h2><p>Token costs vary by task, so smaller actions don't consume a full generation.</p></div><div className="token-guide__items">{[["ATS Analysis", billing?.tokenCosts?.atsAnalysis || 500], ["JD Match", billing?.tokenCosts?.jdMatch || 750], ["Resume Optimization", billing?.tokenCosts?.resumeOptimization || 2000], ["ATS Resume PDF", billing?.tokenCosts?.atsResumeGeneration || 2500]].map(([label, cost]) => <div className="token-guide__item" key={label}><span>{label}</span><strong>{formatTokens(cost)}</strong><small>tokens</small></div>)}</div></section>
    {error && <p className="pricing-card__error" role="alert">{error}</p>}
    <p className="pricing-card__secure"><span>⌁</span> Secure checkout powered by Stripe · Your card details are handled by Stripe</p>
  </div>;
};

export default Pricing;
