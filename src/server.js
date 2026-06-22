import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
    );
    console.log(`   API base: http://localhost:${PORT}/api/v1`);
  });
};

startServer();

// Catch unhandled promise rejections (e.g. DB errors after startup)
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
