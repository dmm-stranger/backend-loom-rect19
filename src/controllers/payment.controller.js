import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Order from "../models/Order.model.js";
import Product from "../models/Product.model.js";
import Cart from "../models/Cart.model.js";
import Coupon from "../models/Coupon.model.js";
import getStripe from "../config/stripe.js";

// @desc    Create a Stripe PaymentIntent for an order
// @route   POST /api/v1/payments/create-payment-intent
// @access  Private
//
// Flow:
// 1. Find the order by ID (must belong to user)
// 2. Create a Stripe PaymentIntent for the order total
// 3. Save the PaymentIntent ID on the order
// 4. Return client_secret to frontend
//    → frontend uses it with Stripe.js to collect card details
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  // Only the order owner can pay for it
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to pay for this order");
  }

  // Prevent creating a new intent if already paid
  if (order.paymentInfo.status === "paid") {
    throw new ApiError(400, "This order has already been paid");
  }

  // Stripe amounts are in the smallest currency unit
  // e.g. $99.99 → 9999 cents
  const amount = Math.round(order.totalPrice * 100);

  const paymentIntent = await getStripe().paymentIntents.create({
    amount,
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  // Save PaymentIntent ID on the order for webhook lookup
  order.paymentInfo.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  res.status(200).json(
    new ApiResponse(
      200,
      { clientSecret: paymentIntent.client_secret },
      "Payment intent created"
    )
  );
});

// @desc    Handle Stripe webhook events
// @route   POST /api/v1/payments/webhook
// @access  Public (Stripe-signed)
//
// ⚠️  This route uses express.raw() in payment.routes.js
//     NOT express.json() — required for Stripe signature verification
//
// Handles:
//   payment_intent.succeeded → mark order paid, reduce stock, clear cart, increment coupon usage
//   payment_intent.payment_failed → mark order payment as failed
export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Verify the event came from Stripe using the webhook secret
    event = getStripe().webhooks.constructEvent(
      req.body,              // raw buffer (not parsed JSON)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // ── Handle events ────────────────────────────
  switch (event.type) {

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({
        "paymentInfo.stripePaymentIntentId": paymentIntent.id,
      });

      if (!order) {
        console.error(`⚠️  Order not found for PaymentIntent: ${paymentIntent.id}`);
        break;
      }

      // Mark order as paid
      order.paymentInfo.status = "paid";
      order.paymentInfo.paidAt = new Date();
      order.orderStatus = "processing";
      await order.save();

      // Reduce stock for each item in the order
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.qty },
        });
      }

      // Increment coupon usedCount if a coupon was applied
      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } }
        );
      }

      // Clear the user's cart now that payment is confirmed
      await Cart.findOneAndUpdate(
        { user: order.user },
        { $set: { items: [], coupon: null } }
      );

      console.log(`✅ Payment confirmed for order: ${order._id}`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({
        "paymentInfo.stripePaymentIntentId": paymentIntent.id,
      });

      if (order) {
        order.paymentInfo.status = "failed";
        await order.save();
        console.log(`❌ Payment failed for order: ${order._id}`);
      }
      break;
    }

    default:
      // Ignore all other Stripe event types
      console.log(`ℹ️  Unhandled Stripe event type: ${event.type}`);
  }

  // Always return 200 to Stripe — otherwise Stripe retries the webhook
  res.status(200).json({ received: true });
});
