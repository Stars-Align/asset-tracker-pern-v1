// api/index.js
// ⚠️ 注意：顶部不要有任何 import ... from ... 语句
// 我们将所有引用都放入 try-catch 中进行“动态加载”

export default async (req, res) => {
    // 防止浏览器缓存 500 错误页面
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    console.log('⚡️ Vercel Function Invoked: ' + req.url);

    try {
        // ============================================================
        // 1. 动态加载模块 (Dynamic Imports)
        // 这是解决 "Dashboard 无报错但页面 500" 的关键！
        // 如果这里有路径错误或文件缺失，会立刻跳到 catch 块并显示出来。
        // ============================================================
        console.log('🔄 Loading backend modules...');
        
        // 这里的路径必须精准，且必须包含 .js 后缀
        const [appModule, dbModule] = await Promise.all([
            import('../backend/src/app.js'),
            import('../backend/src/models/index.js')
        ]);

        const app = appModule.default;
        const sequelize = dbModule.sequelize;
        console.log('✅ Modules loaded successfully!');

        // ============================================================
        // 2. 数据库连接检查
        // ============================================================
        console.log('--- Attempting to connect to DB ---');
        // 设置 5秒 超时，防止请求挂起
        await Promise.race([
            sequelize.authenticate(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB Connection Timeout')), 5000))
        ]);
        console.log('⚡️ Vercel: Database connected successfully');


        // ============================================================
        // 3. 路径重写逻辑 (Path Rewrite)
        // ============================================================
        const originalUrl = req.url;
        if (req.url.startsWith('/api')) {
            req.url = req.url.replace(/^\/api/, '');
        }
        if (req.url === '') {
            req.url = '/';
        }
        console.log(`🚀 Route Rewritten: ${originalUrl} -> ${req.url}`);


        // ============================================================
        // 4. 转交 Express 处理
        // ============================================================
        // 我们不需要再包装 Promise，直接让 Express 接管
        // 因为 app(req, res) 本身在 Serverless 环境下就是异步兼容的
        return app(req, res);

    } catch (criticalError) {
        // ============================================================
        // 🚨 终极错误捕获区 (CRITICAL ERROR HANDLER)
        // ============================================================
        console.error('🚨 CRITICAL STARTUP ERROR:', criticalError);
        
        // 返回详细的 JSON 错误信息
        // 重点查看 message 和 code 字段
        return res.status(500).json({
            status: 'CRITICAL_STARTUP_CRASH',
            error_type: criticalError.name, // 例如 "Error" 或 "SyntaxError"
            message: criticalError.message, // 例如 "Cannot find module..."
            code: criticalError.code,       // 例如 "ERR_MODULE_NOT_FOUND"
            hint: "Check specific file paths in 'stack' or missing .js extensions",
            stack: process.env.NODE_ENV === 'production' ? criticalError.stack : criticalError.stack
        });
    }
};