import app from '../backend/src/app.js';
import { sequelize } from '../backend/src/models/index.js';

// Cache the database connection
let isConnected = false;

export default async (req, res) => {
    console.log('⚡️ Vercel Function Invoked: ' + req.url);

    try {
        // 1. Establish database connection (Cached)
        if (!isConnected) {
            console.log('--- Attempting to connect to DB ---');
            try {
                // Set timeout to prevent hanging connections
                await Promise.race([
                    sequelize.authenticate(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Connection Timeout')), 5000))
                ]);
                isConnected = true;
                console.log('⚡️ Vercel: Database connected successfully');
            } catch (dbError) {
                console.error('❌ Vercel: DB Connection Error:', dbError.message);
                // Return specific error
                return res.status(500).json({
                    error: 'Database Connection Failed',
                    details: dbError.message,
                    hint: 'Check if DATABASE_URL is correct and SSL is enabled.'
                });
            }
        }

        // 2. Path Rewrite Logic
        // Vercel sends /api/auth/login.
        // Express now expects /auth/login (we reverted app.js to standard routes).
        // So we MUST strip /api.
        const originalUrl = req.url;
        if (req.url.startsWith('/api')) {
            req.url = req.url.replace(/^\/api/, '');
        }

        // Handle root case: if url was just /api, it becomes empty, redirect to /
        if (req.url === '') {
            req.url = '/';
        }

        // Log rewrite for debugging
        console.log(`🚀 Route Rewritten: ${originalUrl} -> ${req.url}`);

        // 3. Hand over to Express
        // Wrap in Promise to capture sync/async errors from Express
        return await new Promise((resolve, reject) => {
            app(req, res, (err) => {
                if (err) {
                    console.error('❌ Express Error:', err);
                    return reject(err);
                }
                resolve();
            });
        });

    } catch (criticalError) {
        // Critical error handler
        console.error('🚨 CRITICAL SERVER ERROR:', criticalError);
        return res.status(500).json({
            error: 'Serverless Function Crashed',
            message: criticalError.message,
            stack: process.env.NODE_ENV === 'production' ? 'Hidden in production' : criticalError.stack,
            path: req.url
        });
    }
};