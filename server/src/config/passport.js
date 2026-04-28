import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from './env.js';
import User from '../models/User.js';

passport.use(
  new GitHubStrategy(
    {
      clientID: env.githubClientId,
      clientSecret: env.githubClientSecret,
      callbackURL: env.githubCallbackUrl
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          const email = profile.emails?.[0]?.value;
          user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl;
            await user.save();
          }
        }

        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
            githubId: profile.id,
            avatarUrl: profile.photos?.[0]?.value || '',
            role: 'developer',
            authProvider: 'github'
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
