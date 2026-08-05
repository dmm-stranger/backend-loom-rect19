import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    storeName:          { type: String,  default: "TechStore" },
    storeEmail:         { type: String,  default: "support@techstore.com" },
    currency:           { type: String,  default: "USD", enum: ["USD","EUR","GBP","BDT","INR"] },
    taxRate:            { type: Number,  default: 0.15, min: 0, max: 1 },
    shippingCost:       { type: Number,  default: 10,   min: 0 },
    freeShippingMin:    { type: Number,  default: 100,  min: 0 },
    isStoreOpen:        { type: Boolean, default: true },
    maintenanceMessage: { type: String,  default: "We are under maintenance. Please check back soon." },
    socialLinks: {
      facebook:  { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter:   { type: String, default: "" },
      youtube:   { type: String, default: "" },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
