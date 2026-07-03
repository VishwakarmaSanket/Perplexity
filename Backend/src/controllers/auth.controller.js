import userModel from "../models/user.model.js";
import { sendEmail } from "../services/mail.service.js";
import jwt from "jsonwebtoken";

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserAlreadyExists) {
      return res.status(400).json({
        message: "A user with that username or email already exists",
        success: false,
        error: "User already exists",
      });
    }

    const isDev = process.env.NODE_ENV !== "production";

    // In development, auto-verify so email service is not required
    const user = await userModel.create({
      username,
      email,
      password,
      verified: isDev ? true : false,
    });

    if (isDev) {
      console.log(
        "⚠️  [DEV MODE] User auto-verified — skipping email verification.",
      );
      return res.status(201).json({
        message: "Account created successfully",
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          verified: user.verified,
        },
      });
    }

    // Production: send verification email
    const emailVerificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
    );

    try {
      await sendEmail({
        to: email,
        subject: "🎉 Welcome to Perplexity – Let's Get Started!",
        html: `
         <p>Hi ${username},</p>
                    <p>Thank you for registering at <strong>Perplexity</strong>. We're excited to have you on board!</p>
                    <p>Please verify your email address by clicking the link below:</p>
                    <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                    <p>If you did not create an account, please ignore this email.</p>
                    <p>Best regards,<br>The Perplexity Team</p>
            `,
      });
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      await userModel.findByIdAndDelete(user._id);
      return res.status(500).json({
        message:
          "Failed to send verification email. Account registration rolled back.",
        success: false,
        error: emailError.message || "Email delivery failed",
      });
    }

    res.status(201).json({
      message: "Account created! Please verify your email to log in.",
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("❌ [register] Error:", error.message);

    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      return res.status(400).json({
        message: `An account with that ${field} already exists`,
        success: false,
        error: "Duplicate key",
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        message: messages[0] || "Validation failed",
        success: false,
        error: "Validation error",
      });
    }

    res.status(500).json({
      message: "Registration failed. Please try again.",
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "No account found with that email address",
        success: false,
        error: "User not found",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Incorrect password",
        success: false,
        error: "Invalid credentials",
      });
    }

    if (!user.verified) {
      return res.status(400).json({
        message: "Please verify your email before logging in",
        success: false,
        error: "User not verified",
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("❌ [login] Error:", error.message);
    res.status(500).json({
      message: "Login failed. Please try again.",
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

export async function getMe(req, res) {
  try {
    const userID = req.user.id;

    const user = await userModel.findById(userID).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.error("❌ [getMe] Error:", error.message);
    res.status(500).json({
      message: "Failed to fetch profile",
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

export async function verifyEmail(req, res) {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: "User not found",
      });
    }

    user.verified = true;

    await user.save();

    const html = `   <h1>Email Verified Successfully!</h1>
        <p>Your email has been verified. You can now log in to your account.</p>
        <a href="http://localhost:5173/login">Go to Login</a>
    `;

    res.send(html);
  } catch (err) {
    return res.status(400).json({
      message: "Invalid or expired token",
      success: false,
      error: "Invalid token",
    });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.error("? [logout] Error:", error.message);
    return res.status(500).json({
      message: "Logout failed. Please try again.",
      success: false,
      error: error.message || "Internal server error",
    });
  }
}

