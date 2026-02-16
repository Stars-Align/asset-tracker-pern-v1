import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Profile } from '../models/index.js';
import { config } from './env.js';
import jwt from 'jsonwebtoken';

// 🔍 核心修复：根据 NODE_ENV 动态返回 Callback URL
const getCallbackURL = (provider) => {
    if (process.env.NODE_ENV === 'production') {
        // Vercel Production Environment
        return `https://asset-tracker-pern-v1.vercel.app/api/auth/${provider}/callback`;
    }
    // Local Development Environment
    return `http://localhost:5002/api/auth/${provider}/callback`;
};

// No need for BASE_URL constant anymore as we use full paths
console.log('🔗 Passport Environment:', process.env.NODE_ENV);

export const configurePassport = () => {
    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER',
        // ✅ 修复：使用动态计算的 CALLBACK_URL
        callbackURL: getCallbackURL('google'),
        passReqToCallback: true,
        proxy: true // 🌟 Vercel 是反向代理，必须开启此选项才能正确处理 HTTPS 回调
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const googleId = profile.id;
            const fullName = profile.displayName;

            // MODE 1: ACCOUNT LINKING (JWT token in state)
            if (req.query.state) {
                try {
                    const decoded = jwt.verify(req.query.state, config.jwt.secret);
                    const userId = decoded.userId;

                    const user = await Profile.findByPk(userId);
                    if (user) {
                        await user.update({ google_id: googleId });
                        return done(null, user);
                    }
                } catch (e) {
                    console.error("OAuth State Token Error:", e.message);
                    return done(new Error('Invalid authentication state'));
                }
            }

            // MODE 2: LOGIN FLOW (no token in state)
            // Step A: Check if user with google_id exists
            let user = await Profile.findOne({ where: { google_id: googleId } });
            if (user) {
                return done(null, user);
            }

            // Step B: Auto-link if email exists
            if (email) {
                user = await Profile.findOne({ where: { email } });
                if (user) {
                    await user.update({ google_id: googleId });
                    return done(null, user);
                }
            }

            // Step C: Create new user (auto-registration)
            if (!email) {
                return done(new Error('Email not provided by Google'));
            }

            user = await Profile.create({
                email,
                full_name: fullName,
                google_id: googleId,
                password_hash: null // OAuth users don't have passwords
            });

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    // Microsoft Strategy
    passport.use(new MicrosoftStrategy({
        clientID: process.env.MICROSOFT_CLIENT_ID || 'PLACEHOLDER',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'PLACEHOLDER',
        // ✅ 修复：使用动态计算的 CALLBACK_URL
        callbackURL: getCallbackURL('microsoft'),
        tenant: 'consumers', // Use 'consumers' for personal Microsoft accounts
        scope: ['user.read', 'openid', 'profile', 'email'],
        passReqToCallback: true,
        proxy: true // 🌟 Vercel 是反向代理，必须开启此选项
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const microsoftId = profile.id;
            const fullName = profile.displayName;

            // MODE 1: ACCOUNT LINKING (JWT token in state)
            if (req.query.state) {
                try {
                    const decoded = jwt.verify(req.query.state, config.jwt.secret);
                    const userId = decoded.userId;

                    const user = await Profile.findByPk(userId);
                    if (user) {
                        await user.update({ microsoft_id: microsoftId });
                        return done(null, user);
                    }
                } catch (e) {
                    console.error("OAuth Microsoft State Token Error:", e.message);
                    return done(new Error('Invalid authentication state'));
                }
            }

            // MODE 2: LOGIN FLOW (no token in state)
            let user = await Profile.findOne({ where: { microsoft_id: microsoftId } });
            if (user) {
                return done(null, user);
            }

            if (email) {
                user = await Profile.findOne({ where: { email } });
                if (user) {
                    await user.update({ microsoft_id: microsoftId });
                    return done(null, user);
                }
            }

            if (!email) {
                return done(new Error('Email not provided by Microsoft'));
            }

            user = await Profile.create({
                email,
                full_name: fullName,
                microsoft_id: microsoftId,
                password_hash: null
            });

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));


    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await Profile.findByPk(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};