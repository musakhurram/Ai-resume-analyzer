import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { confirmCheckoutSession, createCheckoutSession, getBillingStatus } from "../services/billing.api";
import "./Pricing.scss";

const DEFAULT_PURCHASE_CREDITS = 10;

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState({ plan: "free", planLabel: "Free", resumeCredits: 0, creditsPerPurchase: DEFAULT_PURCHASE_CREDITS });
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const checkoutState = searchParams.get("checkout");
  const sessionId = searchParams.get("session_id");
  const purchaseCredits = Number(billing.creditsPerPurchase) || DEFAULT_PURCHASE_CREDITS;
  const planLabel = billing.planLabel || (billing.plan === "pro" ? "Pro" : "Free");

  const refreshBilling = async () => {
    const status = await getBillingStatus();
    setBilling(status);
    return status;
  };

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
              creditsPerPurchase: purchaseCredits,
            });
            window.dispatchEvent(new Event("billing:updated"));
          }
        } else {
          await refreshBilling();
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Unable to confirm your payment yet. Please refresh in a moment.");
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

  const handleUpgrade = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await createCheckoutSession();
      window.location.assign(data.url);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-page__intro">
        <span className="pricing-page__eyebrow">Resume Analyzer Pro</span>
        <h1>Build a resume that gets through the first screen.</h1>
        <p>Unlock additional AI resume analysis credits and get more iterations from your ATS workflow.</p>
      </div>

      {checkoutState === "success" && (
        <div className="pricing-page__notice pricing-page__notice--success">
          {confirming ? "Confirming your payment…" : `${planLabel} activated. Your credits are ready.`}
        </div>
      )}
      {checkoutState === "cancelled" && (
        <div className="pricing-page__notice">Checkout was cancelled. No charge was made.</div>
      )}

      <div className="pricing-card">
        <div className="pricing-card__top">
          <div>
            <span className="pricing-card__label">PRO CREDIT PACK</span>
            <h2>{purchaseCredits} AI resume analyses</h2>
            <p>Use credits across ATS scanning, AI optimization and ATS-optimized resume generation.</p>
          </div>
          <div className="pricing-card__price"><strong>$9.99</strong><span>one-time</span></div>
        </div>

        <ul className="pricing-card__features">
          <li>{purchaseCredits} AI resume analysis credits</li>
          <li>ATS compatibility analysis</li>
          <li>AI rewrite workflow</li>
          <li>ATS-optimized PDF generation</li>
        </ul>

        <div className="pricing-card__actions">
          <div className="pricing-card__current">
            Current plan: <strong>{planLabel}</strong>
            <span>{billing.resumeCredits} AI credit{billing.resumeCredits === 1 ? "" : "s"} remaining</span>
          </div>
          <button type="button" className="pricing-card__button" onClick={handleUpgrade} disabled={loading || confirming}>
            {loading ? "Opening checkout…" : confirming ? "Confirming payment…" : billing.plan === "pro" ? "Buy More Credits" : "Upgrade to Pro"}
          </button>
        </div>

        {error && <p className="pricing-card__error" role="alert">{error}</p>}
        <p className="pricing-card__secure">Secure checkout powered by Stripe. Your card details are handled by Stripe.</p>
      </div>
    </div>
  );
};

export default Pricing;
