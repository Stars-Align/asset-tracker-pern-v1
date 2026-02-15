import app from '../backend/src/app.js';
import { sequelize } from '../backend/src/models/index.js';

// 缓存数据库连接
let isConnected = false;

export default async (req, res) => {
    try {
        // 1. 尝试建立数据库连接
        if (!isConnected) {
            console.log('--- Attempting to connect to DB ---');
            try {
                // 设置超时限制，防止连接挂起
                await Promise.race([
                    sequelize.authenticate(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DB Connection Timeout')), 5000))
                ]);
                isConnected = true;
                console.log('⚡️ Vercel: Database connected successfully');
            } catch (dbError) {
                console.error('❌ Vercel: DB Connection Error:', dbError.message);
                // 💥 关键：如果数据库连不上，直接返回具体错误
                return res.status(500).json({
                    error: 'Database Connection Failed',
                    details: dbError.message,
                    hint: 'Check if DATABASE_URL is correct and SSL is enabled.'
                });
            }
        }

        // 2. 路径重写逻辑
        const originalUrl = req.url;
        if (req.url.startsWith('/api')) {
            req.url = req.url.replace(/^\/api/, '');
        }
        if (req.url === '') {
            req.url = '/';
        }

        // 打印调试日志（在 Vercel Logs 中可见）
        console.log(`🚀 Route: ${originalUrl} -> ${req.url}`);

        // 3. 将请求交给 Express 处理
        // 我们用 Promise 包装它，捕获 Express 内部的同步或异步崩溃
        return await new Promise((resolve, reject) => {
            try {
                app(req, res, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            } catch (expressError) {
                reject(expressError);
            }
        });

    } catch (criticalError) {
        // 🚨 终极错误捕获：捕获代码中任何位置的崩溃
        console.error('🚨 CRITICAL SERVER ERROR:', criticalError);

        return res.status(500).json({
            error: 'Serverless Function Crashed',
            message: criticalError.message,
            stack: process.env.NODE_ENV === 'production' ? 'Hidden in production' : criticalError.stack,
            path: req.url
        });
    }
};