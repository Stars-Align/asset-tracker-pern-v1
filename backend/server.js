import app from './src/app.js';
import { sequelize } from './src/models/index.js';

// --- 数据库连接逻辑 ---
let isConnected = false;

async function connectToDatabase() {
    if (isConnected) return;
    try {
        await sequelize.authenticate();
        isConnected = true;
        console.log('⚡️ Database connected.');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error; // 抛出错误以便调用者处理
    }
}

// --- Vercel Serverless 处理函数 (核心逻辑) ---
// Vercel 会调用这个 default export 的函数
export default async (req, res) => {
    // 1. 确保数据库已连接
    try {
        await connectToDatabase();
    } catch (e) {
        return res.status(500).json({ error: 'Database Connection Failed' });
    }

    // 2. 修正路由前缀 (关键步骤)
    // Vercel 的 rewrite 规则会把 /api/xxx 完整的传进来
    // 但 Express 应用通常只定义了 /xxx 路由，所以要去掉 /api 前缀
    if (req.url.startsWith('/api')) {
        req.url = req.url.replace(/^\/api/, '');
    }
    // 防止替换后为空字符串 (比如请求就是 /api)
    if (req.url === '' || req.url === '/') {
        req.url = '/';
    }

    // 3. 转交给 Express 处理
    return app(req, res);
};

// --- 本地运行逻辑 ---
// 下面的代码只会在直接运行 `node backend/server.js` 时执行
// 在 Vercel 环境中，这部分会被忽略
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const PORT = process.env.PORT || 8000;

    // 本地启动前先连接数据库
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`--------------------------------------------------`);
            console.log(`🚀 本地 Server 已启动!`);
            console.log(`📡 监听端口: ${PORT}`);
            console.log(`🌍 API 地址: http://localhost:${PORT}`);
            console.log(`--------------------------------------------------`);
        });
    });
}