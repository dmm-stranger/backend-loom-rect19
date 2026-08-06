import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["order_placed","order_status","order_cancelled","order_refunded","review_deleted","account_banned","admin_message"],
      required: true,
    },
    title:          { type: String, required: true },
    message:        { type: String, required: true },
    reference:      { type: mongoose.Schema.Types.ObjectId, default: null },
    referenceModel: { type: String, enum: ["Order","Product","Review",null], default: null },
    isRead:         { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.statics.createNotification = async function ({ userId, type, title, message, reference = null, referenceModel = null }) {
  try {
    await this.create({ user: userId, type, title, message, reference, referenceModel });
  } catch (err) {
    console.error(`⚠️  Could not create notification: ${err.message}`);
  }
};

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
