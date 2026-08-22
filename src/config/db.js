import mongoose from "mongoose";

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 *
 * IMPORTANT: Never call process.exit() here. This file runs inside a
 * Vercel serverless function (see src/index.js). process.exit() kills
 * the Lambda instantly — before index.js's try/catch can respond —
 * which Vercel reports as FUNCTION_INVOCATION_FAILED with no useful
 * error message. Throwing instead lets index.js catch it and return
 * a proper JSON 500 with the real error.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
