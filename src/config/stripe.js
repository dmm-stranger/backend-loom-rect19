import Stripe from "stripe";

// ─────────────────────────────────────────────
//  STRIPE SDK INIT — lazy, not top-level
//
//  This used to construct `new Stripe(...)` at module load time. Stripe's
//  SDK throws synchronously if no key is given, and since this file sits
//  on the import chain that every route pulls in (payment.controller.js →
//  payment.routes.js → routes/index.js → app.js), a missing
//  STRIPE_SECRET_KEY crashed the *entire* function during cold start —
//  including completely unrelated routes like GET / — before index.js's
//  own try/catch even existed to catch it. Vercel reports that as
//  FUNCTION_INVOCATION_FAILED instead of a normal error response.
//
//  Creating the client on first actual use means a missing key only
//  breaks payment routes, with a clear error, instead of the whole API.
// ─────────────────────────────────────────────
let _stripe;

function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in the environment");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }
  return _stripe;
}

export default getStripe;
