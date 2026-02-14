import app from '../backend/src/app.js'; // 👈 引入你的 Express app
import { sequelize } from '../backend/src/models/index.js'; // 👈 引入数据库

// 缓存数据库连接
let isConnected = false;

export default async (req, res) => {
    // 1. 建立数据库连接
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

    // 2. 关键：路径重写逻辑
    // Vercel 收到请求是 /api/auth/login
    // Express 路由通常定义为 /auth/login
    // 所以我们需要把 /api 去掉，否则 Express 路由匹配不到
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace(/^\/api/, '');
    }

    // 如果去掉 /api 后变为空，补上 /
    if (req.url === '') req.url = '/';

    // 3. 将请求转交给 Express
    return app(req, res);
};