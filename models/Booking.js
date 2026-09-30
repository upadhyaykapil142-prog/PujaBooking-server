const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    pujaId: {
      type: Number,
      required: true,
    },

    pujaName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    yajman: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      mobile: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      locationType: {
        type: String,
        enum: ["HOME", "ONLINE", "home", "online"],
        required: true,
      },
    },

    // Pandit Assignment
    // Existing bookings can remain without a Pandit.
    // Admin can assign one later.
    pandit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    panditAssignedAt: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    utr: {
      type: String,
      default: null,
      trim: true,
    },

    bookingStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "ASSIGNED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);