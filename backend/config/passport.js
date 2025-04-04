const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const db = require('../models'); // Access models via index
const User = db.User;
require('dotenv').config();

module.exports = function(passport) {

  // --- Local Strategy (Email/Password Login) ---
  passport.use(new LocalStrategy({
      usernameField: 'email', // We are using email as the username
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        // 1. Find user by email
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
          // User not found
          return done(null, false, { message: 'Incorrect email.' });
        }

        // 2. Check if password matches (using the method we added to the model)
        // Make sure user has a password_hash (might be social login only user)
        if (!user.password_hash) {
            return done(null, false, { message: 'Please log in using your social account or set a password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
          // Password matches, return user
          return done(null, user);
        } else {
          // Password doesn't match
          return done(null, false, { message: 'Incorrect password.' });
        }
      } catch (err) {
        console.error("Error in LocalStrategy:", err);
        return done(err); // Internal server error
      }
    }
  ));

  // --- JWT Strategy (Protecting Routes) ---
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // Expecting "Bearer <token>" in Authorization header
  opts.secretOrKey = process.env.JWT_SECRET;
  // opts.issuer = 'yourdomain.com'; // Optional: Validate issuer
  // opts.audience = 'yourapp.com'; // Optional: Validate audience

  passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        // jwt_payload contains the decoded JWT payload (e.g., { id: user.id, email: user.email })
        const user = await User.findByPk(jwt_payload.id); // Find user based on ID in token

        if (user) {
            // User found, return user object (will be attached to req.user)
            return done(null, user);
        } else {
            // User not found (token might be valid but user deleted)
            return done(null, false);
        }
    } catch (err) {
        console.error("Error in JwtStrategy:", err);
        return done(err, false);
    }
  }));

  // Optional: Serialize/Deserialize User (Needed if using sessions, less critical for pure JWT)
  // passport.serializeUser((user, done) => {
  //   done(null, user.id);
  // });
  // passport.deserializeUser(async (id, done) => {
  //   try {
  //     const user = await User.findByPk(id);
  //     done(null, user); // Attaches user to req.user
  //   } catch (err) {
  //     done(err);
  //   }
  // });

  console.log('Passport strategies configured.');
};
