import api from "../../../shared/api/client";

export async function createCheckoutSession(plan) {
  const response = await api.post("/api/stripe/create-checkout-session", { plan });
  return response.data;
}

export async function getBillingStatus() {
  const response = await api.get("/api/stripe/billing-status", { params: { t: Date.now() } });
  return response.data;
}

export async function confirmCheckoutSession(sessionId) {
  const response = await api.get("/api/stripe/confirm-checkout-session", {
    params: { session_id: sessionId, t: Date.now() },
  });
  return response.data;
}
