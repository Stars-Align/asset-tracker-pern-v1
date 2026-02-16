import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import connectPgSimple from 'connect-pg-simple'; // 👈 1. 引入 PG Store

// 配置与数据库
import { config } from './config/env.js';
// 注意：虽然 Session 不再直接用 sequelize.pool，但我们仍需导入 sequelize 以确保数据库初始化
import sequelize from './config/database.js';
import { configurePassport } from './config/passport.js';
import { errorHandler } from './middleware/errorHandler.js';

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

// ====================================================================
// 🌟 关键修改 A: 信任 Vercel 代理
// 没有这一行，express 认为请求是 http 的，会导致 secure cookie 失效
// ====================================================================
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// ====================================================================
// 🌟 关键修改 B: CORS 配置 (允许携带凭证)
// ====================================================================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://asset-tracker-pern-v1.vercel.app', // 你的生产前端域名
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // 宽松检查：只要是 vercel.app 结尾的都允许 (方便 Preview 部署)
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        } else {
            console.log("Blocked Origin:", origin);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // 必须为 true 才能接收 Cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// ====================================================================
// 🌟 关键修改 C: Session 配置 (持久化存储 + 安全 Cookie)
// ====================================================================
const PgSession = connectPgSimple(session);
const isProduction = config.nodeEnv === 'production';

app.use(session({
    store: new PgSession({
        // ❌ 删除: pool: sequelize.connectionManager.pool, (这会导致 query is not a function 错误)
        // ✅ 新增: 使用 conObject 直接传入连接配置，让插件自己管理连接
        conObject: {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Vercel/Neon 环境必须开启此选项
            }
        },
        tableName: 'session', // 确保你的数据库里会自动创建这张表
        createTableIfMissing: true // 自动建表
    }),
    secret: config.jwt.secret || 'default_secret_key',
    resave: false,
    saveUninitialized: false, // 只有登录成功才创建 session
    proxy: true, // 配合 trust proxy
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 天
        httpOnly: true, // 防止 XSS 偷取 Cookie
        // ⚠️ Vercel 生产环境强制开启 Secure 和 SameSite: None
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    }
}));

// Passport initialization
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Asset Tracker API is running',
        env: config.nodeEnv,
        timestamp: new Date().toISOString(),
    });
});

app.get('/debug-health', (req, res) => res.send('Server is running!'));

// API routes
// Mount all routes under /api to match Vercel's rewrite structure
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/lending-logs', lendingLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global error handler
app.use(errorHandler);

export default app;