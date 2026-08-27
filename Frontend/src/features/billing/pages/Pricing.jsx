import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { confirmCheckoutSession, createCheckoutSession, getBillingStatus } from "../services/billing.api";
import "./Pricing.scss";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    generations: 3,
    description: "A simple way to try Resume Analyzer before upgrading.",
    features: [
      "3 AI resume generations",
      "ATS compatibility analysis",
      "JD match review",
      "Past reports saved to your account",
    ],
    cta: "Current Free Plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "one-time",
    generations: 20,
    description: "The best balance for regular job applications and resume iterations.",
    features: [
      "20 AI resume generations",
      "ATS compatibility analysis",
      "JD match review",
      "AI resume optimization",
      "ATS-optimized PDF generation",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$19.99",
    period: "one-time",
    generations: 50,
    description: "For intensive applications, multiple roles, and frequent resume iterations.",
    features: [
      "50 AI resume generations",
      "ATS compatibility analysis",
      "JD match review",
      "AI resume optimization",
      "ATS-optimized PDF generation",
      "Largest generation allowance",
    ],
    cta: "Get Premium",
  },
];

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState({ plan: "free", planLabel: "Free", resumeCredits: 3, generations: 3 });
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
            setBilling({
              plan: result.plan,
              planLabel: result.planLabel,
              resumeCredits: result.resumeCredits,
              generations: result.generations || result.creditsPerPurchase || 3,
            });
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
          setError(err.response?.data?.message || "Unable to load your billing status. Please refresh in a moment.");
        }
      } finally {
        if (active) setConfirming(false);
      }
    }

    loadBilling();
    return () => {
      active = false;
    };
  }, [checkoutState, sessionId]);

  const handleUpgrade = async (plan) => {
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

  return (
    <div className="pricing-page">
      <div className="pricing-page__intro">
        <span className="pricing-page__eyebrow">Resume Analyzer Plans</span>
        <h1>Choose the right amount of AI power for your job search.</h1>
        <p>Every AI generation uses one credit. Credits are enforced securely on the server and your remaining balance follows your account.</p>
      </div>

      {checkoutState === "success" && (
        <div className="pricing-page__notice pricing-page__notice--success">
          {confirming
            ? "Confirming your payment…"
            : paymentConfirmed
              ? `${billing.planLabel} activated. You now have ${billing.resumeCredits} AI generations remaining.`
              : "Payment is still processing. Your generations will appear here once Stripe confirms the payment."}
        </div>
      )}
      {checkoutState === "cancelled" && (
        <div className="pricing-page__notice">Checkout was cancelled. No charge was made.</div>
      )}

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const isCurrent = billing.plan === plan.id;
          const isFree = plan.id === "free";
          const isLoading = loadingPlan === plan.id;
          return (
            <article key={plan.id} className={`pricing-card ${plan.popular ? "pricing-card--popular" : ""} ${isCurrent ? "pricing-card--current" : ""}`}>
              {plan.popular && <span className="pricing-card__popular">MOST POPULAR</span>}
              <div className="pricing-card__top">
                <div>
                  <span className="pricing-card__label">{plan.name}</span>
                  <h2>{plan.generations} AI generations</h2>
                  <p>{plan.description}</p>
                </div>
                <div className="pricing-card__price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
              </div>

              <ul className="pricing-card__features">
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>

              <button
                type="button"
                className={`pricing-card__button ${isCurrent ? "pricing-card__button--current" : ""}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={isFree || Boolean(loadingPlan) || confirming}
              >
                {isFree && isCurrent
                  ? "Current Free Plan"
                  : isCurrent
                    ? isLoading ? "Opening checkout…" : `Buy More ${plan.name} Credits`
                    : isLoading ? "Opening checkout…" : plan.cta}
              </button>
            </article>
          );
        })}
      </div>

      <div className="pricing-page__balance">
        <strong>{billing.planLabel || "Free"} Plan</strong>
        <span>{billing.resumeCredits ?? 0} AI generations remaining</span>
      </div>

      {error && <p className="pricing-card__error" role="alert">{error}</p>}
      <p className="pricing-card__secure">Secure checkout powered by Stripe. Your card details are handled by Stripe.</p>
    </div>
  );
};

export default Pricing;
