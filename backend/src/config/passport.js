import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Profile } from '../models/index.js';
import { config } from './env.js';
import jwt from 'jsonwebtoken';

// 🔍 核心修复：动态获取当前环境的 Base URL
const getBaseUrl = () => {
    // 1. 优先读取我们在 Vercel 设置的显式变量
    if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
    
    // 2. 其次读取 Vercel 自动提供的 URL (注意：Vercel 提供的默认不带 https://)
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    
    // 3. 读取本地配置文件
    if (config.apiUrl) return config.apiUrl;
    
    // 4. 本地开发保底
    return 'http://localhost:5002';
};

const BASE_URL = getBaseUrl().replace(/\/$/, ''); // 移除末尾可能的斜杠
console.log('🔗 Passport Callback Base URL:', BASE_URL); // 部署后在 Log 里看一眼确认

export const configurePassport = () => {
    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER',
        // ✅ 修复：使用动态计算的 BASE_URL
        callbackURL: `${BASE_URL}/api/auth/google/callback`,
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
        // ✅ 修复：使用动态计算的 BASE_URL
        callbackURL: `${BASE_URL}/api/auth/microsoft/callback`,
        tenant: 'common', // Use 'consumers' for personal Microsoft accounts
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