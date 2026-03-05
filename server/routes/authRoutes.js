const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  return /(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password);
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const createDemoAuthResponse = async (provider) => {
  const normalizedProvider = String(provider || "demo").toLowerCase();

  const providerConfig = {
    google:  { name: "Google Demo User",  email: "demo.google@speaksense.ai",  jobTitle: "Software Engineer", authProvider: "google" },
    github:  { name: "GitHub Demo User",  email: "demo.github@speaksense.ai",  jobTitle: "Software Engineer", authProvider: "github" },
    demo:    { name: "Demo User",         email: "demo.user@speaksense.ai",    jobTitle: "Software Engineer", authProvider: "demo"   }
  };

  const selected = providerConfig[normalizedProvider] || providerConfig.demo;

  // Baseline payload — used when DB is unavailable so demo always works
  const baseUser = {
    _id: `demo_${selected.authProvider}`,
    name: selected.name,
    email: selected.email,
    industry: "Software Development",
    experience: "3-5 years",
    company: "SpeakSense Demo",
    jobTitle: selected.jobTitle,
    authProvider: selected.authProvider,
    isDemo: true
  };

  let user = baseUser;

  try {
    const dbUser = await User.findOne({ email: selected.email });
    if (dbUser) {
      user = dbUser;
    } else {
      const hashed = await bcrypt.hash(`${selected.authProvider}Demo@1234`, 10);
      user = await User.create({
        name: selected.name,
        email: selected.email,
        password: hashed,
        company: baseUser.company,
        jobTitle: selected.jobTitle,
        industry: baseUser.industry,
        experience: baseUser.experience,
        authProvider: selected.authProvider
      });
    }
  } catch (dbErr) {
    // MongoDB unreachable — fall back to in-memory demo without persistence
    console.warn(`[demo-auth] DB unavailable (${dbErr.message}), using in-memory demo`);
  }

  // Embed user profile in JWT so /me can serve it even when DB is down
  const tokenPayload = {
    id:         String(user._id),
    name:       user.name       || baseUser.name,
    email:      user.email      || baseUser.email,
    industry:   user.industry   || baseUser.industry,
    experience: user.experience || baseUser.experience,
    company:    user.company    || baseUser.company,
    jobTitle:   user.jobTitle   || baseUser.jobTitle,
    isDemo:     user.isDemo     || false
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured on the server");
  }

  let token;
  try {
    token = jwt.sign(tokenPayload, secret, { expiresIn: "7d" });
  } catch (jwtErr) {
    throw new Error(`Token signing failed: ${jwtErr.message}`);
  }

  return {
    message: `${selected.authProvider} demo login successful`,
    token,
    user: {
      id:         tokenPayload.id,
      name:       tokenPayload.name,
      email:      tokenPayload.email,
      industry:   tokenPayload.industry,
      experience: tokenPayload.experience,
      company:    tokenPayload.company,
      jobTitle:   tokenPayload.jobTitle
    }
  };
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, company, jobTitle, experience, industry, interests, newsletter } = req.body;
    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters with uppercase, lowercase, number & special character"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      phone: phone || '',
      company: company || '',
      jobTitle: jobTitle || '',
      experience: experience || '',
      industry: industry || '',
      interests: interests || [],
      newsletter: newsletter || false,
      authProvider: 'local'
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return success without exposing password
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        experience: user.experience,
        company: user.company,
        jobTitle: user.jobTitle
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validation
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        experience: user.experience,
        company: user.company,
        jobTitle: user.jobTitle
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

router.post("/social", async (req, res) => {
  try {
    const { provider, mode } = req.body;
    const normalizedProvider = String(provider || "").toLowerCase();

    if (!["google", "github"].includes(normalizedProvider)) {
      return res.status(400).json({ message: "Unsupported social provider" });
    }

    if (mode !== "demo") {
      return res.status(400).json({
        message: "Social OAuth is not configured yet. Use demo mode for now."
      });
    }

    const payload = await createDemoAuthResponse(normalizedProvider);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Social auth error:", error.message, error.stack);
    return res.status(500).json({ message: `Server error during social login: ${error.message}` });
  }
});

router.post("/demo", async (_req, res) => {
  try {
    const payload = await createDemoAuthResponse("demo");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Demo auth error:", error.message, error.stack);
    return res.status(500).json({ message: `Server error during demo login: ${error.message}` });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Demo tokens (or any token with embedded profile) can skip the DB call
  const isDemoId = String(decoded.id || "").startsWith("demo_");
  if (isDemoId || decoded.isDemo) {
    return res.status(200).json({
      user: {
        id:           decoded.id,
        name:         decoded.name         || "Demo User",
        email:        decoded.email        || "demo@speaksense.ai",
        industry:     decoded.industry     || "Software Development",
        experience:   decoded.experience   || "",
        company:      decoded.company      || "SpeakSense Demo",
        jobTitle:     decoded.jobTitle     || "Software Engineer",
        interests:    decoded.interests    || [],
        authProvider: decoded.authProvider || "demo"
      }
    });
  }

  // Normal DB-backed user
  try {
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      user: {
        id:           user._id,
        name:         user.name,
        email:        user.email,
        industry:     user.industry     || "",
        experience:   user.experience   || "",
        company:      user.company      || "",
        jobTitle:     user.jobTitle     || "",
        interests:    user.interests    || [],
        authProvider: user.authProvider || "local"
      }
    });
  } catch (dbErr) {
    console.error("[/me] DB error:", dbErr.message);
    // If DB is down but the token has embedded profile data, serve it
    if (decoded.name && decoded.email) {
      return res.status(200).json({
        user: {
          id:           decoded.id,
          name:         decoded.name,
          email:        decoded.email,
          industry:     decoded.industry   || "",
          experience:   decoded.experience || "",
          company:      decoded.company    || "",
          jobTitle:     decoded.jobTitle   || "",
          interests:    [],
          authProvider: decoded.authProvider || "local"
        }
      });
    }
    return res.status(503).json({ message: "Database unavailable" });
  }
});

module.exports = router;