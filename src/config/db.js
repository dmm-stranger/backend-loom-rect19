import mongoose from "mongoose";

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 *
 * On a traditional long-running server, `process.exit(1)` on failure makes
 * sense — the whole server is useless without a DB, so exit and let your
 * process manager restart it. On Vercel's serverless functions, calling
 * process.exit() kills the entire function invocation immediately, which
 * Vercel reports as FUNCTION_INVOCATION_FAILED rather than a normal error
 * response. It also can't "restart" the same way — it just fails the
 * request. Throwing instead lets index.js's own try/catch handle it and
 * return a clean 500 JSON response.
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
