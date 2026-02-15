import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Profile } from '../models/index.js';
import { config } from '../config/env.js';
import { BadRequestError, UnauthorizedError } from '../middleware/errorHandler.js';

// Register Function
export const register = async (req, res, next) => {
    try {
        const { email, password, full_name } = req.body;

        // Check if user already exists
        const existingUser = await Profile.findOne({ where: { email } });
        if (existingUser) {
            throw new BadRequestError('User with this email already exists');
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const user = await Profile.create({
            email,
            password_hash,
            full_name: full_name || null,
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    is_admin: user.is_admin,
                    pro_expiry: user.pro_expiry,
                    created_at: user.created_at,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Login Function
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Check if user exists
        const user = await Profile.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // 2. Check password
        if (!user.password_hash) {
            throw new UnauthorizedError('Please login with Google/Microsoft');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // 3. Generate Token with isAdmin flag
        const token = jwt.sign(
            { userId: user.id, is_admin: user.is_admin },
            config.jwt.secret,
            { expiresIn: '7d' }
        );

        // 4. Send Response
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                is_admin: user.is_admin,
                pro_expiry: user.pro_expiry,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Current User Profile
export const getMe = async (req, res, next) => {
    try {
        const user = await Profile.findByPk(req.user.id);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    is_admin: user.is_admin,
                    pro_expiry: user.pro_expiry,
                    google_id: user.google_id,
                    microsoft_id: user.microsoft_id,
                    avatar_url: user.avatar_url,
                    created_at: user.created_at,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Update Profile
export const updateProfile = async (req, res, next) => {
    try {
        const { full_name, email } = req.body;
        const user = await Profile.findByPk(req.user.id);

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        await user.update({
            full_name: full_name || user.full_name,
            email: email || user.email,
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    is_admin: user.is_admin,
                    pro_expiry: user.pro_expiry,
                    google_id: user.google_id,
                    microsoft_id: user.microsoft_id,
                    avatar_url: user.avatar_url,
                    created_at: user.created_at,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// 🌟 Upgrade Pro (PayPal Success Callback)
// Modified: Updates pro_expiry instead of is_admin
export const upgradePro = async (req, res, next) => {
    try {
        // 1. Validate User
        if (!req.user || !req.user.id) {
            throw new UnauthorizedError('User not found in session');
        }

        const { orderID } = req.body;
        console.log(`💰 Processing Pro upgrade for User ID: ${req.user.id}, PayPal Order: ${orderID}`);

        // 2. Find User
        const user = await Profile.findByPk(req.user.id);
        if (!user) {
            throw new UnauthorizedError('User profile not found');
        }

        // 3. Upgrade Logic: Calculate Pro Expiry
        // Subscription duration: 30 days
        const DURATION_DAYS = 30;
        const durationMs = DURATION_DAYS * 24 * 60 * 60 * 1000;
        
        const now = new Date();
        const currentExpiry = user.pro_expiry ? new Date(user.pro_expiry) : null;

        let newExpiry;

        // Logic: 
        // If user is already Pro and it hasn't expired yet -> Extend from current expiry date
        // If user is not Pro or expired -> Start 30 days from NOW
        if (currentExpiry && currentExpiry > now) {
            newExpiry = new Date(currentExpiry.getTime() + durationMs);
            console.log(`🔄 Extending Pro membership from ${currentExpiry.toISOString()} to ${newExpiry.toISOString()}`);
        } else {
            newExpiry = new Date(now.getTime() + durationMs);
            console.log(`🆕 New Pro membership starting now until ${newExpiry.toISOString()}`);
        }

        // Update the field
        user.pro_expiry = newExpiry;
        
        // Save to DB
        await user.save();

        // 4. Return Success
        res.status(200).json({
            success: true,
            message: 'User upgraded to Pro successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    is_admin: user.is_admin, 
                    pro_expiry: user.pro_expiry // Frontend uses this to show "Pro" badge
                }
            }
        });
    } catch (error) {
        console.error('❌ Upgrade failed:', error);
        next(error);
    }
};

// Unlink Social Provider
export const unlinkProvider = async (req, res, next) => {
    try {
        const { provider } = req.params; // 'google' or 'microsoft'
        const user = await Profile.findByPk(req.user.id);

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        const updateData = {};
        if (provider === 'google') updateData.google_id = null;
        if (provider === 'microsoft') updateData.microsoft_id = null;

        await user.update(updateData);

        res.json({
            success: true,
            message: `${provider} unlinked successfully`
        });
    } catch (error) {
        next(error);
    }
};

// OAuth Callback Handler
export const oauthCallback = async (req, res) => {
    // Generate JWT after successful OAuth
    const token = jwt.sign(
        {
            userId: req.user.id,
            is_admin: req.user.is_admin
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    // Ensure FRONTEND_URL is set in Vercel Environment Variables
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Check if this is account linking (has state token) or login (no state)
    const hasStateToken = req.query.state && req.query.state.length > 50; 

    if (hasStateToken) {
        // MODE: Account Linking - redirect to profile
        res.redirect(`${frontendUrl}/profile?auth=success`);
    } else {
        // MODE: OAuth Login - redirect with token
        res.redirect(`${frontendUrl}/auth/success?token=${token}`);
    }
};

// Upload Avatar
export const uploadAvatar = async (req, res, next) => {
    try {
        const { avatar } = req.body; // base64 image string
        console.log('Upload Avatar Request:', { userId: req.user?.id, avatarLength: avatar?.length });
        const userId = req.user.id;

        if (!avatar) {
            throw new BadRequestError('Avatar image is required');
        }

        // Update user's avatar_url with base64 image
        const user = await Profile.findByPk(userId);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        await user.update({ avatar_url: avatar });

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                },
            },
        });
    } catch (error) {
        console.error('Upload Avatar Error:', error);
        next(error);
    }
};