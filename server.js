require("dotenv").config();

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const User = require("./models/User");
const Booking = require("./models/Booking");

const {
  sendBookingEmail,
  sendPaymentVerifiedEmail,
  sendAdminNewBookingEmail,
  sendAdminPaymentSubmittedEmail,
  sendAdminPaymentVerifiedEmail,
  sendAdminBookingCancelledEmail,
  sendAdminPanditAssignedEmail,
  sendAdminBookingCompletedEmail,
} = require("./services/emailService");
const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5175";

const ALLOWED_ORIGINS = [
  "http://localhost:5175",
  "https://panditkishanupadh.in",
  "https://www.panditkishanupadh.in",
];

// ============================================
// DATABASE
// ============================================

async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from .env"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB connected successfully"
    );
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:"
    );

    console.error(error.message);
  }
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: [
      "http://localhost:5175",
      "https://panditkishanupadh.in",
      "https://www.panditkishanupadh.in",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "puja-booking-session-secret",

    resave: false,

    saveUninitialized: false,
cookie: {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge:
    7 * 24 * 60 * 60 * 1000,
},
  })
);

// ============================================
// PASSPORT
// ============================================

app.use(
  passport.initialize()
);

app.use(
  passport.session()
);

// ============================================
// AUTH MIDDLEWARE
// ============================================

function requireLogin(
  req,
  res,
  next
) {
  if (
    req.isAuthenticated &&
    req.isAuthenticated()
  ) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Login required.",
  });
}

// ============================================
// ADMIN ACCESS
// ============================================

function requireAdmin(
  req,
  res,
  next
) {
  if (
    !req.isAuthenticated ||
    !req.isAuthenticated()
  ) {
    return res.status(401).json({
      success: false,
      message: "Login required.",
    });
  }

  if (
    !req.user ||
    req.user.role !== "ADMIN"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Admin access required.",
    });
  }

  next();
}

// ============================================
// PANDIT ACCESS
// ============================================

function requirePandit(
  req,
  res,
  next
) {
  if (
    !req.isAuthenticated ||
    !req.isAuthenticated()
  ) {
    return res.status(401).json({
      success: false,
      message: "Login required.",
    });
  }

  if (
    !req.user ||
    req.user.role !== "PANDIT"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Pandit access required.",
    });
  }

  next();
}

// ============================================
// HOME
// ============================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "PujaBooking API is running.",
  });
});

// ============================================
// GOOGLE AUTH
// ============================================

app.get(
  "/auth/google",
  passport.authenticate(
    "google",
    {
      scope: [
        "profile",
        "email",
      ],

      // Always show Google account chooser
      prompt: "select_account",
    }
  )
);

app.get(
  "/auth/google/callback",
  passport.authenticate(
    "google",
    {
      failureRedirect:
        `${FRONTEND_URL}/login`,
    }
  ),
  (req, res) => {
    // ==========================================
    // ROLE-BASED REDIRECT AFTER GOOGLE LOGIN
    // ==========================================

    if (
      req.user &&
      req.user.role === "ADMIN"
    ) {
      return res.redirect(
        `${FRONTEND_URL}/admin`
      );
    }

    if (
      req.user &&
      req.user.role === "PANDIT"
    ) {
      return res.redirect(
        `${FRONTEND_URL}/pandit`
      );
    }

    // Default Yajman redirect
    return res.redirect(
      `${FRONTEND_URL}/`
    );
  }
);

// ============================================
// CURRENT USER
// ============================================

app.get(
  "/auth/me",
  (req, res) => {
    if (
      !req.isAuthenticated ||
      !req.isAuthenticated()
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Not logged in.",
      });
    }

    return res.json({
      success: true,

      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profilePicture:
          req.user.profilePicture,
        role: req.user.role,
      },
    });
  }
);

// ============================================
// LOGOUT
// ============================================

app.get(
  "/auth/logout",
  (req, res, next) => {
    req.logout((error) => {
      if (error) {
        return next(error);
      }

      req.session.destroy(
        (sessionError) => {
          if (sessionError) {
            console.error(
              "SESSION DESTROY ERROR:",
              sessionError
            );
          }

          res.clearCookie(
            "connect.sid"
          );

          return res.redirect(
            FRONTEND_URL
          );
        }
      );
    });
  }
);

// ============================================
// CREATE BOOKING
// ============================================

app.post(
  "/api/bookings",
  async (req, res) => {
    try {
      const {
        pujaId,
        pujaName,
        price,
        date,
        time,
        yajman,
      } = req.body;

      if (
        pujaId === undefined ||
        !pujaName ||
        price === undefined ||
        !date ||
        !time ||
        !yajman
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing booking information.",
        });
      }

      if (
        !yajman.name ||
        !yajman.mobile ||
        !yajman.email ||
        !yajman.address ||
        !yajman.city ||
        !yajman.locationType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complete Yajman details are required.",
        });
      }

      const booking =
        await Booking.create({
          pujaId,
          pujaName,
          price,
          date,
          time,

          yajman: {
            name:
              yajman.name.trim(),

            mobile:
              yajman.mobile.trim(),

            email:
              yajman.email
                .trim()
                .toLowerCase(),

            address:
              yajman.address.trim(),

            city:
              yajman.city.trim(),

            locationType:
              yajman.locationType,
          },

          paymentStatus:
            "PENDING",

          utr: null,

          bookingStatus:
            "PENDING",

          pandit: null,

          panditAssignedAt:
            null,
        });

      // ============================================
      // CUSTOMER BOOKING EMAIL
      // ============================================

      try {
        const emailResult =
          await sendBookingEmail({
            to:
              booking.yajman.email,

            customerName:
              booking.yajman.name,

            pujaName:
              booking.pujaName,

            bookingId:
              booking._id.toString(),

            bookingDate:
              booking.date,

            bookingTime:
              booking.time,
          });

        if (!emailResult.success) {
          console.error(
            "⚠️ Customer booking email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "⚠️ CUSTOMER BOOKING EMAIL ERROR:",
          emailError.message
        );
      }

      // ============================================
      // ADMIN - NEW BOOKING EMAIL
      // ============================================

      try {
        const adminEmailResult =
          await sendAdminNewBookingEmail({
            bookingId:
              booking._id.toString(),

            customerName:
              booking.yajman.name,

            customerEmail:
              booking.yajman.email,

            customerMobile:
              booking.yajman.mobile,

            pujaName:
              booking.pujaName,

            bookingDate:
              booking.date,

            bookingTime:
              booking.time,

            amount:
              booking.price,

            city:
              booking.yajman.city,

            locationType:
              booking.yajman.locationType,

            address:
              booking.yajman.address,
          });

        if (!adminEmailResult.success) {
          console.error(
            "⚠️ Admin new booking email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "⚠️ ADMIN NEW BOOKING EMAIL ERROR:",
          emailError.message
        );
      }

      return res.status(201).json({
        success: true,

        message:
          "Booking created successfully.",

        booking,
      });
    } catch (error) {
      console.error(
        "CREATE BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to create booking.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// GET ALL BOOKINGS
// ============================================

app.get(
  "/api/bookings",
  async (req, res) => {
    try {
      const bookings =
        await Booking.find()
          .populate(
            "pandit",
            "_id name email profilePicture role"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        bookings,
      });
    } catch (error) {
      console.error(
        "GET BOOKINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch bookings.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// MY BOOKINGS
// ============================================

app.get(
  "/api/my-bookings",
  requireLogin,
  async (req, res) => {
    try {
      const userEmail =
        req.user.email
          .trim()
          .toLowerCase();

      const bookings =
        await Booking.find({
          "yajman.email":
            userEmail,
        })
          .populate(
            "pandit",
            "_id name email profilePicture role"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        bookings,
      });
    } catch (error) {
      console.error(
        "GET MY BOOKINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch your bookings.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// USER CANCEL BOOKING
// ============================================

app.patch(
  "/api/my-bookings/:id/cancel",
  requireLogin,
  async (req, res) => {
    try {
      const userEmail =
        req.user.email
          .trim()
          .toLowerCase();

      const booking =
        await Booking.findOne({
          _id: req.params.id,

          "yajman.email":
            userEmail,
        });

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      if (
        booking.bookingStatus ===
        "CANCELLED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Booking is already cancelled.",
        });
      }

      if (
        booking.bookingStatus ===
        "COMPLETED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Completed bookings cannot be cancelled.",
        });
      }

      booking.bookingStatus =
        "CANCELLED";

      await booking.save();

      // ============================================
      // ADMIN - USER CANCELLED BOOKING
      // ============================================

      try {
        const adminEmailResult =
          await sendAdminBookingCancelledEmail({
            bookingId:
              booking._id.toString(),

            customerName:
              booking.yajman.name,

            customerEmail:
              booking.yajman.email,

            customerMobile:
              booking.yajman.mobile,

            pujaName:
              booking.pujaName,

            bookingDate:
              booking.date,

            bookingTime:
              booking.time,

            amount:
              booking.price,

            cancelledBy:
              "Yajman",
          });

        if (!adminEmailResult.success) {
          console.error(
            "⚠️ Admin cancellation email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "⚠️ ADMIN USER CANCELLATION EMAIL ERROR:",
          emailError.message
        );
      }

      return res.json({
        success: true,

        message:
          "Booking cancelled successfully.",

        booking,
      });
    } catch (error) {
      console.error(
        "CANCEL MY BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to cancel booking.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// UPI / UTR PAYMENT
// ============================================

app.patch(
  "/api/bookings/:id/payment",
  async (req, res) => {
    try {
      const { utr } =
        req.body;

      if (
        !utr ||
        !utr.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "UTR is required.",
        });
      }

      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      booking.utr =
        utr.trim();

      booking.paymentStatus =
        "PAID";

      booking.bookingStatus =
        "PENDING";

      await booking.save();

      // ============================================
      // ADMIN - PAYMENT SUBMITTED
      // ============================================

      try {
        const adminEmailResult =
          await sendAdminPaymentSubmittedEmail({
            bookingId:
              booking._id.toString(),

            customerName:
              booking.yajman.name,

            customerEmail:
              booking.yajman.email,

            customerMobile:
              booking.yajman.mobile,

            pujaName:
              booking.pujaName,

            bookingDate:
              booking.date,

            bookingTime:
              booking.time,

            amount:
              booking.price,

            utr:
              booking.utr,
          });

        if (!adminEmailResult.success) {
          console.error(
            "⚠️ Admin payment submitted email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "⚠️ ADMIN PAYMENT SUBMITTED EMAIL ERROR:",
          emailError.message
        );
      }

      return res.json({
        success: true,

        message:
          "Payment details submitted successfully.",

        booking,
      });
    } catch (error) {
      console.error(
        "PAYMENT UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to update payment.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - BOOKINGS
// ============================================

app.get(
  "/api/admin/bookings",
  requireAdmin,
  async (req, res) => {
    try {
      const bookings =
        await Booking.find()
          .populate(
            "pandit",
            "_id name email profilePicture role"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        bookings,
      });
    } catch (error) {
      console.error(
        "ADMIN GET BOOKINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch admin bookings.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - VERIFY PAYMENT
// ============================================

app.patch(
  "/api/bookings/:id/verify-payment",
  requireAdmin,
  async (req, res) => {
    try {
      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      if (
        booking.bookingStatus ===
        "CANCELLED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Cancelled bookings cannot be confirmed.",
        });
      }

      const wasAlreadyConfirmed =
        booking.bookingStatus ===
        "CONFIRMED";

      booking.paymentStatus =
        "PAID";

      booking.bookingStatus =
        "CONFIRMED";

      await booking.save();

      // ============================================
      // CUSTOMER - PAYMENT VERIFIED
      // ============================================

      if (!wasAlreadyConfirmed) {
        try {
          const emailResult =
            await sendPaymentVerifiedEmail({
              to:
                booking.yajman.email,

              customerName:
                booking.yajman.name,

              pujaName:
                booking.pujaName,

              bookingId:
                booking._id.toString(),

              bookingDate:
                booking.date,

              bookingTime:
                booking.time,

              amount:
                booking.price,

              utr:
                booking.utr,
            });

          if (!emailResult.success) {
            console.error(
              "⚠️ Payment verified, but customer confirmation email could not be sent."
            );
          }
        } catch (emailError) {
          console.error(
            "⚠️ CUSTOMER PAYMENT VERIFIED EMAIL ERROR:",
            emailError.message
          );
        }
      }

      // ============================================
      // ADMIN - PAYMENT VERIFIED
      // ============================================

      if (!wasAlreadyConfirmed) {
        try {
          const adminEmailResult =
            await sendAdminPaymentVerifiedEmail({
              bookingId:
                booking._id.toString(),

              customerName:
                booking.yajman.name,

              customerEmail:
                booking.yajman.email,

              customerMobile:
                booking.yajman.mobile,

              pujaName:
                booking.pujaName,

              bookingDate:
                booking.date,

              bookingTime:
                booking.time,

              amount:
                booking.price,

              utr:
                booking.utr,

              verifiedBy:
                req.user?.name ||
                "Admin",
            });

          if (!adminEmailResult.success) {
            console.error(
              "⚠️ Admin payment verification email could not be sent."
            );
          }
        } catch (emailError) {
          console.error(
            "⚠️ ADMIN PAYMENT VERIFIED EMAIL ERROR:",
            emailError.message
          );
        }
      }

      const updatedBooking =
        await Booking.findById(
          booking._id
        ).populate(
          "pandit",
          "_id name email profilePicture role"
        );

      return res.json({
        success: true,

        message:
          "Payment verified successfully.",

        booking:
          updatedBooking,
      });
    } catch (error) {
      console.error(
        "VERIFY PAYMENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to verify payment.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - CANCEL BOOKING
// ============================================

app.patch(
  "/api/bookings/:id/cancel",
  requireAdmin,
  async (req, res) => {
    try {
      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      booking.bookingStatus =
        "CANCELLED";

      await booking.save();

      // ============================================
      // ADMIN - BOOKING CANCELLED
      // ============================================

      try {
        const adminEmailResult =
          await sendAdminBookingCancelledEmail({
            bookingId:
              booking._id.toString(),

            customerName:
              booking.yajman.name,

            customerEmail:
              booking.yajman.email,

            customerMobile:
              booking.yajman.mobile,

            pujaName:
              booking.pujaName,

            bookingDate:
              booking.date,

            bookingTime:
              booking.time,

            amount:
              booking.price,

            cancelledBy:
              req.user?.name ||
              "Admin",
          });

        if (!adminEmailResult.success) {
          console.error(
            "⚠️ Admin cancellation email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "⚠️ ADMIN CANCELLATION EMAIL ERROR:",
          emailError.message
        );
      }

      return res.json({
        success: true,

        message:
          "Booking cancelled successfully.",

        booking,
      });
    } catch (error) {
      console.error(
        "ADMIN CANCEL BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to cancel booking.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - GET PANDITS
// ============================================

app.get(
  "/api/admin/pandits",
  requireAdmin,
  async (req, res) => {
    try {
      const pandits =
        await User.find({
          role: "PANDIT",
        })
          .select(
            "_id name email profilePicture role"
          )
          .sort({
            name: 1,
          });

      return res.json({
        success: true,
        pandits,
      });
    } catch (error) {
      console.error(
        "GET PANDITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch Pandits.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - CREATE PANDIT
// ============================================

app.post(
  "/api/admin/pandits",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        email,
        profilePicture,
      } = req.body;

      if (
        !name ||
        !email
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Name and email are required.",
        });
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,

          message:
            "This email already has an account. Please use a separate email for the Pandit account.",
        });
      }

      const pandit =
        await User.create({
          name:
            name.trim(),

          email:
            normalizedEmail,

          profilePicture:
            profilePicture
              ? profilePicture.trim()
              : null,

          role: "PANDIT",
        });

      return res.status(201).json({
        success: true,

        message:
          "Pandit account created successfully.",

        pandit: {
          _id:
            pandit._id,

          name:
            pandit.name,

          email:
            pandit.email,

          profilePicture:
            pandit.profilePicture,

          role:
            pandit.role,
        },
      });
    } catch (error) {
      console.error(
        "CREATE PANDIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to create Pandit account.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - ASSIGN PANDIT
// ============================================

app.patch(
  "/api/admin/bookings/:id/assign-pandit",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        panditId,
      } = req.body;

      if (!panditId) {
        return res.status(400).json({
          success: false,

          message:
            "Pandit ID is required.",
        });
      }

      const pandit =
        await User.findOne({
          _id: panditId,

          role: "PANDIT",
        });

      if (!pandit) {
        return res.status(404).json({
          success: false,

          message:
            "Pandit not found.",
        });
      }

      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      if (
        booking.bookingStatus ===
        "CANCELLED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Cancelled bookings cannot be assigned.",
        });
      }

      booking.pandit =
        pandit._id;

      booking.panditAssignedAt =
        new Date();

      if (
        booking.bookingStatus ===
        "CONFIRMED"
      ) {
        booking.bookingStatus =
          "ASSIGNED";
      }

      await booking.save();

      // ============================================
      // ADMIN - PANDIT ASSIGNED
      // ============================================

      try {
        const adminEmailResult =
          await sendAdminPanditAssignedEmail({
            bookingId:
              booking._id.toString(),

            customerName:
              booking.yajman.name,

            customerEmail:
              booking.yajman.email,

            customerMobile:
              booking.yajman.mobile,

            pujaName:
              booking.pujaName,

            bookingDate:
              booking.date,

            bookingTime:
              booking.time,

            amount:
              booking.price,

            panditName:
              pandit.name,

            panditEmail:
              pandit.email,
          });

        if (!adminEmailResult.success) {
          console.error(
            "⚠️ Admin Pandit assignment email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "⚠️ ADMIN PANDIT ASSIGNMENT EMAIL ERROR:",
          emailError.message
        );
      }

      const updatedBooking =
        await Booking.findById(
          booking._id
        ).populate(
          "pandit",
          "_id name email profilePicture role"
        );

      return res.json({
        success: true,

        message:
          "Pandit assigned successfully.",

        booking:
          updatedBooking,
      });
    } catch (error) {
      console.error(
        "ASSIGN PANDIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to assign Pandit.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - UNASSIGN PANDIT
// ============================================

app.patch(
  "/api/admin/bookings/:id/unassign-pandit",
  requireAdmin,
  async (req, res) => {
    try {
      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      booking.pandit =
        null;

      booking.panditAssignedAt =
        null;

      if (
        booking.bookingStatus ===
        "ASSIGNED"
      ) {
        booking.bookingStatus =
          "CONFIRMED";
      }

      await booking.save();

      const updatedBooking =
        await Booking.findById(
          booking._id
        ).populate(
          "pandit",
          "_id name email profilePicture role"
        );

      return res.json({
        success: true,

        message:
          "Pandit assignment removed.",

        booking:
          updatedBooking,
      });
    } catch (error) {
      console.error(
        "UNASSIGN PANDIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to remove Pandit assignment.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// PANDIT - ASSIGNED BOOKINGS
// ============================================

app.get(
  "/api/pandit/bookings",
  requirePandit,
  async (req, res) => {
    try {
      const bookings =
        await Booking.find({
          pandit:
            req.user._id,
        })
          .populate(
            "pandit",
            "_id name email profilePicture role"
          )
          .sort({
            date: 1,
            time: 1,
          });

      return res.json({
        success: true,
        bookings,
      });
    } catch (error) {
      console.error(
        "PANDIT GET BOOKINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch assigned bookings.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// PANDIT - UPDATE STATUS
// ============================================

app.patch(
  "/api/pandit/bookings/:id/status",
  requirePandit,
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

      const allowedStatuses = [
        "ASSIGNED",
        "COMPLETED",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking status.",
        });
      }

      const booking =
        await Booking.findOne({
          _id: req.params.id,

          pandit:
            req.user._id,
        });

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Assigned booking not found.",
        });
      }

      if (
        booking.bookingStatus ===
        "CANCELLED"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Cancelled bookings cannot be updated.",
        });
      }

      const previousStatus =
        booking.bookingStatus;

      booking.bookingStatus =
        status;

      await booking.save();

      // ============================================
      // ADMIN - PUJA COMPLETED
      // ============================================

      if (
        status === "COMPLETED" &&
        previousStatus !== "COMPLETED"
      ) {
        try {
          const adminEmailResult =
            await sendAdminBookingCompletedEmail({
              bookingId:
                booking._id.toString(),

              customerName:
                booking.yajman.name,

              customerEmail:
                booking.yajman.email,

              customerMobile:
                booking.yajman.mobile,

              pujaName:
                booking.pujaName,

              bookingDate:
                booking.date,

              bookingTime:
                booking.time,

              amount:
                booking.price,

              panditName:
                req.user.name,

              panditEmail:
                req.user.email,
            });

          if (!adminEmailResult.success) {
            console.error(
              "⚠️ Admin booking completed email could not be sent."
            );
          }
        } catch (emailError) {
          console.error(
            "⚠️ ADMIN BOOKING COMPLETED EMAIL ERROR:",
            emailError.message
          );
        }
      }

      return res.json({
        success: true,

        message:
          "Booking status updated successfully.",

        booking,
      });
    } catch (error) {
      console.error(
        "PANDIT STATUS UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to update booking status.",

        error:
          error.message,
      });
    }
  }
);

// ============================================
// ERROR HANDLER
// ============================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Internal server error.",

      error:
        error.message,
    });
  }
);

// ============================================
// START SERVER
// ============================================

async function startServer() {
  await connectDB();

  app.listen(
    PORT,
    () => {
      console.log(
        "===================================="
      );

      console.log(
        `PujaBooking server running on port ${PORT}`
      );

      console.log(
        `Frontend: ${FRONTEND_URL}`
      );

      console.log(
        "===================================="
      );
    }
  );
}

startServer();