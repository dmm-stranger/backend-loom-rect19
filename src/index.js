
// Loads .env into process.env as a side effect, before anything else that
// might read process.env at import time. Previously this called
// `dotenv.config()` without ever importing `dotenv` — an undefined
// variable reference thrown at module load, in this exact entry file, on
// every single request. That's the direct cause of the FUNCTION_INVOCATION_
// FAILED crashes: the whole module graph fails before `handler` is even
// defined, so nothing — including a plain GET / — could ever succeed.
import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

let connected = false;

export default async function handler(req, res) {
  try {
    if (!connected) {
      await connectDB();
      connected = true;
    }

    return app(req, res);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}