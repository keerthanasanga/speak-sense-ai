const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  role: { type: String, default: "user" },
  phone: { type: String, default: "" },
  company: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  experience: { type: String, default: "" },
  industry: { type: String, default: "" },
  interests: { type: [String], default: [] },
  newsletter: { type: Boolean, default: false },
  authProvider: { type: String, default: "local" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
