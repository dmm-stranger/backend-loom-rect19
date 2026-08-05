import Settings from "../models/Settings.model.js";

const FALLBACK_TAX_RATE          = 0.15;
const FALLBACK_SHIPPING_COST     = 10;
const FALLBACK_FREE_SHIPPING_MIN = 100;

const calculateOrderTotals = async (items = [], discount = 0) => {
  let taxRate, shippingCost, freeShippingMin;
  try {
    const settings = await Settings.getSettings();
    taxRate         = settings.taxRate;
    shippingCost    = settings.shippingCost;
    freeShippingMin = settings.freeShippingMin;
  } catch (_) {
    console.warn("⚠️  Could not load settings — using default rates");
    taxRate         = FALLBACK_TAX_RATE;
    shippingCost    = FALLBACK_SHIPPING_COST;
    freeShippingMin = FALLBACK_FREE_SHIPPING_MIN;
  }

  const itemsPrice    = parseFloat(items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2));
  const shippingPrice = itemsPrice >= freeShippingMin ? 0 : shippingCost;
  const taxPrice      = parseFloat((itemsPrice * taxRate).toFixed(2));
  const appliedDiscount = parseFloat(Math.min(discount, itemsPrice).toFixed(2));
  const totalPrice    = parseFloat((itemsPrice + shippingPrice + taxPrice - appliedDiscount).toFixed(2));

  return { itemsPrice, shippingPrice, taxPrice, discount: appliedDiscount, totalPrice };
};

export default calculateOrderTotals;
