import app from '../backend/src/app.js';
import { sequelize } from '../backend/src/models/index.js';

// Cache the database connection
let isConnected = false;

export default async (req, res) => {
    // 1. Establish database connection (Cached)
    if (!isConnected) {
        try {
            await sequelize.authenticate();
            isConnected = true;
            console.log('⚡️ Vercel: Database connected');
        } catch (error) {
            console.error('❌ Vercel: DB Connection Error:', error);
            return res.status(500).json({ error: 'Database Connection Failed' });
        }
    }

    // 2. Path Rewrite Logic
    // Vercel sends /api/auth/login.
    // Express now expects /auth/login (we reverted app.js to standard routes).
    // So we MUST strip /api.
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace(/^\/api/, '');
    }

    // Handle root case: if url was just /api, it becomes empty, redirect to /
    if (req.url === '') {
        req.url = '/';
    }

    console.log('⚡️ Vercel Request Rewritten:', req.url);

    console.log('RUNNING Vercel Function: ' + req.url);

    // 3. Hand over to Express
    return app(req, res);
};