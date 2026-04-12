import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "./models/User.js";

export const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.BACKEND_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract useful info with safe defaults
          const email = profile.emails?.[0]?.value || "";
          const name = profile.displayName || "Unknown";
          const avatar = profile.photos?.[0]?.value?.replace("s96-c", "s256-c") || "";

          // Check if user already exists
          let user = await UserModel.findOne({ email });

          if (user) {
            // Update user with Google info if not already set
            user.googleId ||= profile.id;
            user.name ||= name;
            user.avatar ||= avatar;

            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await UserModel.create({
            name,
            email,
            googleId: profile.id,
            avatar,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );

  // Note: serializeUser/deserializeUser not needed since we're using JWT instead of sessions
};

export default passport;