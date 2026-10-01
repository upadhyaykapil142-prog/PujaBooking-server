const passport = require("passport");
const GoogleStrategy =
  require("passport-google-oauth20").Strategy;

const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID:
        process.env.GOOGLE_CLIENT_ID,

      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "https://pujabooking-server.onrender.com/auth/google/callback",
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        const email =
          profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error(
              "Google account email not available."
            )
          );
        }

        const normalizedEmail =
          email.toLowerCase();

        let user =
          await User.findOne({
            email: normalizedEmail,
          });

        if (!user) {
          user =
            await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: normalizedEmail,
              profilePicture:
                profile.photos?.[0]?.value || null,
              role: "YAJMAN",
            });
        } else {
          user.googleId = profile.id;
          user.name = profile.displayName;

          if (profile.photos?.[0]?.value) {
            user.profilePicture =
              profile.photos[0].value;
          }

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error(
          "Google authentication error:",
          error
        );

        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(
  async (id, done) => {
    try {
      const user =
        await User.findById(id);

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

module.exports = passport;