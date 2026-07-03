import "dotenv/config";
import mongoose from "mongoose";
import userModel from "./src/models/user.model.js";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clean up existing test user if any
    await userModel.deleteOne({ email: "test@example.com" });

    // Create verified test user
    const user = await userModel.create({
      username: "testuser",
      email: "test@example.com",
      password: "password123", // Hashed automatically by the user schema pre-save hook
      verified: true,
    });

    console.log("Test user created successfully!");
    console.log("Email: test@example.com");
    console.log("Password: password123");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding user:", error);
    process.exit(1);
  }
}

seed();
