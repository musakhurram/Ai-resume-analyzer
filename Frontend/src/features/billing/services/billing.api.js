import api from "../../../shared/api/client";

export async function createCheckoutSession() {
  const response = await api.post("/api/stripe/create-checkout-session");
  return response.data;
}

export async function getBillingStatus() {
  const response = await api.get("/api/stripe/billing-status");
  return response.data;
}
