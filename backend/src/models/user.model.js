import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    // CHANGED: password is required only for users who do NOT have a Google account
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    // NEW: Google account id (unique, but many normal users have none)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // NEW: profile picture URL (from Google). Empty for normal users.
    avatar: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// CHANGED: skip hashing when there is no password (Google-only users)
userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// CHANGED: Google-only users have no password, so the comparison is always false
userSchema.methods.comparePassword = async function (userPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(userPassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

export default userModel;
