import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { confirmCheckoutSession, createCheckoutSession, getBillingStatus } from "../services/billing.api";
import "./Pricing.scss";

const PLANS = [
  { id: "free", name: "Free", price: "$0", period: "forever", tokens: 3000, description: "Try the complete Resume Analyzer workflow with a starter token balance.", features: ["3,000 AI tokens", "ATS compatibility analysis", "JD match review", "Past reports saved to your account"], cta: "Current Free Plan" },
  { id: "pro", name: "Pro", price: "$9.99", period: "one-time", tokens: 25000, description: "More AI power for regular applications, revisions, and interview preparation.", features: ["25,000 AI tokens", "ATS compatibility analysis", "JD match review", "AI resume optimization", "ATS-optimized PDF generation"], cta: "Get Pro", popular: true },
  { id: "premium", name: "Premium", price: "$19.99", period: "one-time", tokens: 75000, description: "A large token balance for intensive applications and frequent resume iterations.", features: ["75,000 AI tokens", "ATS compatibility analysis", "JD match review", "AI resume optimization", "ATS-optimized PDF generation", "Extensive interview preparation"], cta: "Get Premium" },
];

const formatTokens = (value) => Number(value || 0).toLocaleString();

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState({ plan: "free", planLabel: "Free", aiTokens: 3000, tokensPerPurchase: 3000 });
  const [loadingPlan, setLoadingPlan] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState("");
  const checkoutState = searchParams.get("checkout");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    let active = true;
    async function loadBilling() {
      try {
        if (checkoutState === "success" && sessionId) {
          setConfirming(true);
          const result = await confirmCheckoutSession(sessionId);
          if (active) {
            setBilling(result);
            setPaymentConfirmed(Boolean(result.confirmed));
            window.dispatchEvent(new Event("billing:updated"));
          }
        } else {
          const status = await getBillingStatus();
          if (active) setBilling(status);
        }
      } catch (err) {
        if (active) {
          setPaymentConfirmed(false);
          setError(err.response?.data?.message || "Unable to load your token balance. Please refresh in a moment.");
        }
      } finally { if (active) setConfirming(false); }
    }
    loadBilling();
    return () => { active = false; };
  }, [checkoutState, sessionId]);

  const handlePurchase = async (plan) => {
    if (plan === "free") return;
    setError("");
    setLoadingPlan(plan);
    try {
      const data = await createCheckoutSession(plan);
      window.location.assign(data.url);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start checkout. Please try again.");
      setLoadingPlan("");
    }
  };

  return <div className="pricing-page">
    <div className="pricing-page__intro">
      <span className="pricing-page__eyebrow">Resume Analyzer Plans</span>
      <h1>More AI power. One simple token balance.</h1>
      <p>AI tokens are app usage units. Different features use different amounts, so you get more value from one balance instead of losing a whole credit for every small action.</p>
    </div>

    {checkoutState === "success" && <div className="pricing-page__notice pricing-page__notice--success">{confirming ? "Confirming your payment…" : paymentConfirmed ? `${billing.planLabel} activated. ${formatTokens(billing.aiTokens)} AI tokens are now available.` : "Payment is still processing. Your token balance will update once Stripe confirms it."}</div>}
    {checkoutState === "cancelled" && <div className="pricing-page__notice">Checkout was cancelled. No charge was made.</div>}

    <div className="pricing-grid">
      {PLANS.map((plan) => {
        const isCurrent = billing.plan === plan.id;
        const isFree = plan.id === "free";
        const isLoading = loadingPlan === plan.id;
        return <article key={plan.id} className={`pricing-card ${plan.popular ? "pricing-card--popular" : ""} ${isCurrent ? "pricing-card--current" : ""}`}>
          {plan.popular && <span className="pricing-card__popular">MOST POPULAR</span>}
          <div className="pricing-card__top">
            <div><span className="pricing-card__label">{plan.name}</span><h2>{formatTokens(plan.tokens)} AI tokens</h2><p>{plan.description}</p></div>
            <div className="pricing-card__price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
          </div>
          <ul className="pricing-card__features">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <button type="button" className={`pricing-card__button ${isCurrent ? "pricing-card__button--current" : ""}`} onClick={() => handlePurchase(plan.id)} disabled={isFree || Boolean(loadingPlan) || confirming}>
            {isFree && isCurrent ? "Current Free Plan" : isCurrent ? `Buy More ${plan.name} Tokens` : isLoading ? "Opening checkout…" : plan.cta}
          </button>
        </article>;
      })}
    </div>

    <div className="pricing-page__balance"><strong>{billing.planLabel || "Free"} Plan</strong><span>{formatTokens(billing.aiTokens)} AI tokens remaining</span></div>
    {billing.tokenCosts && <div className="pricing-page__costs"><strong>Typical token costs</strong><span>ATS {formatTokens(billing.tokenCosts.atsAnalysis)}</span><span>JD Match {formatTokens(billing.tokenCosts.jdMatch)}</span><span>Optimization {formatTokens(billing.tokenCosts.resumeOptimization)}</span><span>ATS PDF {formatTokens(billing.tokenCosts.atsResumeGeneration)}</span></div>}
    {error && <p className="pricing-card__error" role="alert">{error}</p>}
    <p className="pricing-card__secure">Secure checkout powered by Stripe. Your card details are handled by Stripe.</p>
  </div>;
};

export default Pricing;
