const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
const env = require("../config/env");
const { verifyGoogleIdToken } = require("../services/google.service");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    domain: env.COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function toPublicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl || null,
  };
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password
 * @access Public
 */
async function registerUserController(req, res, next) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide username, email, and password",
      });
    }

    if (typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username: username.trim() }, { email: normalizedEmail }],
    });

    if (isUserAlreadyExists) {
      return res.status(409).json({
        message: "Account already exists with this email address or username",
      });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await userModel.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hash,
      authProvider: "local",
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both email and password",
      });
    }

    const user = await userModel
      .findOne({ email: String(email).trim().toLowerCase() })
      .select("+password");

    // Same generic message whether the account or password is wrong, and
    // whether the account uses Google Sign-In — avoids leaking which
    // accounts exist / how they authenticate.
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "User logged in successfully",
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @name googleAuthController
 * @description sign in or register a user via a verified Google ID token
 * @access Public
 */
async function googleAuthController(req, res, next) {
  try {
    const { credential } = req.body || {};
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const profile = await verifyGoogleIdToken(credential);
    const normalizedEmail = profile.email.trim().toLowerCase();

    let user = await userModel.findOne({
      $or: [{ googleId: profile.googleId }, { email: normalizedEmail }],
    });

    if (user && !user.googleId) {
      // Existing local account with the same email — link the Google
      // identity to it instead of creating a duplicate account.
      user.googleId = profile.googleId;
      user.authProvider = user.authProvider === "local" ? user.authProvider : "google";
      if (profile.picture) user.avatarUrl = profile.picture;
      await user.save();
    }

    if (!user) {
      const baseUsername = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "user";
      let username = baseUsername;
      let suffix = 0;
      // Ensure uniqueness against the required unique username field.
      while (await userModel.exists({ username })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`;
      }

      user = await userModel.create({
        username,
        email: normalizedEmail,
        authProvider: "google",
        googleId: profile.googleId,
        avatarUrl: profile.picture,
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Signed in with Google successfully",
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add token in blacklist
 * @access Public
 */
async function logoutUserController(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization);

    if (token) {
      await tokenBlacklistModel.create({ token });
    }

    res.clearCookie("token", { domain: env.COOKIE_DOMAIN });
    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access Private
 */
async function getMeController(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  googleAuthController,
  logoutUserController,
  getMeController,
};
