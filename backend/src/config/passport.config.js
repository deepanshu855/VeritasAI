import "dotenv/config";
import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/user.model.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const randomSuffix = (length = 4) => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
};

const generateUniqueUsername = async (email) => {
  const localPart = email.split("@")[0] || "user";
  const sanitized = localPart.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  const base = sanitized || "user";

  const baseTaken = await userModel.exists({ username: base });
  if (!baseTaken) return base;

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${base}_${randomSuffix(4)}`;
    const taken = await userModel.exists({ username: candidate });
    if (!taken) return candidate;
  }

  return `${base}_${crypto.randomBytes(4).toString("hex")}`;
};

export const verifyGoogleProfile = async (
  _accessToken,
  _refreshToken,
  profile,
  cb,
) => {
  try {
    const emailEntry = profile.emails?.[0];
    const rawEmail = emailEntry?.value?.trim();
    const isVerified =
      emailEntry?.verified === true ||
      emailEntry?.verified === "true" ||
      profile._json?.email_verified === true ||
      profile._json?.email_verified === "true";

    if (!rawEmail || !isVerified) {
      return cb(null, false);
    }

    const normalizedEmail = rawEmail.toLowerCase();
    const photo = profile.photos?.[0]?.value?.trim() || "";

    let user = await userModel.findOne({ googleId: profile.id });
    if (user) {
      return cb(null, user);
    }

    user = await userModel.findOne({
      email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i"),
    });

    if (user) {
      user.googleId = profile.id;
      if (!user.avatar && photo) {
        user.avatar = photo;
      }
      await user.save();
      return cb(null, user);
    }

    const username = await generateUniqueUsername(normalizedEmail);
    const newUser = {
      username,
      email: normalizedEmail,
      googleId: profile.id,
    };
    if (photo) {
      newUser.avatar = photo;
    }

    user = await userModel.create(newUser);
    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
};

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      verifyGoogleProfile,
    ),
  );
}

export default passport;
