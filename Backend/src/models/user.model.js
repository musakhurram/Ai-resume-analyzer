const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: [true, "Username already taken"],
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      unique: [true, "Account already exists with this email"],
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Not required for accounts created via Google Sign-In.
      required: function () {
        return this.authProvider === "local";
      },
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many docs with no googleId
    },
    avatarUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

const userModel = mongoose.models.users || mongoose.model("users", userSchema);
module.exports = userModel;
