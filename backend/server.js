import app from './src/app.js';
import { sequelize } from './src/models/index.js';

// 缓存数据库连接状态 (防止每次请求都重新连)
let isConnected = false;

export default async (req, res) => {
    // 1. 确保数据库已连接
    if (!isConnected) {
        try {
            await sequelize.authenticate();
            isConnected = true;
            console.log('⚡️ Database connected for Serverless Function');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            return res.status(500).json({ error: 'Database Connection Failed' });
        }
    }

    // 2. 修正路由前缀 (最关键的一步！)
    // Vercel 发来的请求是 "/api/auth/login"
    // 如果你的 Express 路由只定义了 "/auth/login"，这里必须把 "/api" 切掉
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace(/^\/api/, '') || '/';
    }

    // 如果切完变成空字符串，补一个斜杠
    if (req.url === '') req.url = '/';

    // 3. 将请求转交给 Express 处理
    return app(req, res);
};