const { Router } = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const {
  createCheckoutSessionController,
  getBillingStatusController,
  confirmCheckoutSessionController,
} = require("../controllers/stripe.controller");

const stripeRouter = Router();

stripeRouter.post(
  "/create-checkout-session",
  authUser,
  createCheckoutSessionController,
);
stripeRouter.get("/billing-status", authUser, getBillingStatusController);
stripeRouter.get(
  "/confirm-checkout-session",
  authUser,
  confirmCheckoutSessionController,
);

module.exports = stripeRouter;
