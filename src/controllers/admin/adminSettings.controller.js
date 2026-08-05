import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import Settings from "../../models/Settings.model.js";

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  res.status(200).json(new ApiResponse(200, { settings }, "Settings fetched"));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const {
    storeName, storeEmail, currency, taxRate,
    shippingCost, freeShippingMin, isStoreOpen,
    maintenanceMessage, socialLinks,
  } = req.body;

  const settings = await Settings.getSettings();

  if (storeName          !== undefined) settings.storeName          = storeName;
  if (storeEmail         !== undefined) settings.storeEmail         = storeEmail;
  if (currency           !== undefined) settings.currency           = currency;
  if (isStoreOpen        !== undefined) settings.isStoreOpen        = isStoreOpen;
  if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;

  if (taxRate !== undefined) {
    if (taxRate < 0 || taxRate > 1) throw new ApiError(400, "taxRate must be between 0 and 1");
    settings.taxRate = taxRate;
  }
  if (shippingCost !== undefined) {
    if (shippingCost < 0) throw new ApiError(400, "shippingCost cannot be negative");
    settings.shippingCost = shippingCost;
  }
  if (freeShippingMin !== undefined) {
    if (freeShippingMin < 0) throw new ApiError(400, "freeShippingMin cannot be negative");
    settings.freeShippingMin = freeShippingMin;
  }
  if (socialLinks) {
    if (socialLinks.facebook  !== undefined) settings.socialLinks.facebook  = socialLinks.facebook;
    if (socialLinks.instagram !== undefined) settings.socialLinks.instagram = socialLinks.instagram;
    if (socialLinks.twitter   !== undefined) settings.socialLinks.twitter   = socialLinks.twitter;
    if (socialLinks.youtube   !== undefined) settings.socialLinks.youtube   = socialLinks.youtube;
  }

  await settings.save();
  res.status(200).json(new ApiResponse(200, { settings }, "Settings updated successfully"));
});
