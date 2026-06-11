import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import User from "../models/User.model.js";

/**
 * Phase 1 seeder: creates an admin user and a sample customer.
 * Product/Category/Order seed data will be added once those models
 * exist (Phase 3+).
 *
 * Usage:
 *   npm run seed          -> import data
 *   npm run seed:destroy  -> wipe users collection
 */

const users = [
  {
    name: process.env.ADMIN_NAME || "Admin User",
    email: process.env.ADMIN_EMAIL || "[email protected]",
    password: process.env.ADMIN_PASSWORD || "Admin@12345",
    role: "admin",
  },
  {
    name: "Demo Customer",
    email: "[email protected]",
    password: "Customer@123",
    role: "customer",
  },
];

const importData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await User.create(users); // password hashing handled by pre("save") hook

    console.log("✅ Users seeded successfully:");
    users.forEach((u) => console.log(`   - ${u.role}: ${u.email} / ${u.password}`));
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    console.log("🗑️  All users removed");
    process.exit(0);
  } catch (error) {
    console.error(`❌ Destroy failed: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
