import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import passport from 'passport';
import session from 'express-session';
import { configurePassport } from './config/passport.js';

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import locationRoutes from './routes/locations.js';
import categoryRoutes from './routes/categories.js';
import itemRoutes from './routes/items.js';
import lendingLogRoutes from './routes/lendingLogs.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Security middleware
app.use(helmet());

// Session and Passport
app.use(session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173', // Local development
    'https://asset-tracker-pern-v1.vercel.app', // Production Vercel domain
    process.env.FRONTEND_URL // Allow env variable override
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if the origin matches or is a Vercel subdomain
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        } else {
            console.log("Blocked Origin:", origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Health check endpoint
// Health check endpoint
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Asset Tracker API is running',
        timestamp: new Date().toISOString(),
    });
});

// Simple debug route for Vercel
app.get('/debug-health', (req, res) => res.send('Server is running!'));

// API routes
// API routes
app.use('/auth', authRoutes);
app.use('/users', authRoutes); // Users route reusing authRoutes? Verified in previous step context, might be alias.
app.use('/profiles', profileRoutes);
app.use('/locations', locationRoutes);
app.use('/categories', categoryRoutes);
app.use('/items', itemRoutes);
app.use('/lending-logs', lendingLogRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
