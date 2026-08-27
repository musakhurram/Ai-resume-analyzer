import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { createCheckoutSession, getBillingStatus } from "../services/billing.api";
import "./Pricing.scss";

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState({ plan: "free", resumeCredits: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBillingStatus().then(setBilling).catch(() => {});
  }, []);

  const checkoutState = searchParams.get("checkout");

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
          Payment completed. Your Pro credits will appear as soon as Stripe confirms the payment.
        </div>
      )}
      {checkoutState === "cancelled" && (
        <div className="pricing-page__notice">Checkout was cancelled. No charge was made.</div>
      )}

      <div className="pricing-card">
        <div className="pricing-card__top">
          <div>
            <span className="pricing-card__label">PRO CREDIT PACK</span>
            <h2>10 AI resume analyses</h2>
            <p>Use the credits across ATS scanning, AI improvements and future resume iterations.</p>
          </div>
          <div className="pricing-card__price"><strong>$9.99</strong><span>one-time</span></div>
        </div>

        <ul className="pricing-card__features">
          <li>10 additional resume analysis credits</li>
          <li>ATS compatibility analysis</li>
          <li>AI rewrite workflow</li>
          <li>ATS-optimized PDF generation</li>
        </ul>

        <div className="pricing-card__actions">
          <div className="pricing-card__current">
            Current plan: <strong>{billing.plan === "pro" ? "Pro" : "Free"}</strong>
            <span>{billing.resumeCredits} purchased credits remaining</span>
          </div>
          <button type="button" className="pricing-card__button" onClick={handleUpgrade} disabled={loading}>
            {loading ? "Opening checkout…" : "Get Pro Credits"}
          </button>
        </div>

        {error && <p className="pricing-card__error" role="alert">{error}</p>}
        <p className="pricing-card__secure">Secure checkout powered by Stripe. Your card details are handled by Stripe.</p>
      </div>
    </div>
  );
};

export default Pricing;
