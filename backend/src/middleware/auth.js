import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Profile } from '../models/index.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header or query param
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from database
        const user = await Profile.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token may be invalid.',
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            is_admin: user.is_admin,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: error.message,
        });
    }
};
