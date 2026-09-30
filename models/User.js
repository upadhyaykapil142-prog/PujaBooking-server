const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["YAJMAN", "PANDIT", "ADMIN"],
      default: "YAJMAN",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);