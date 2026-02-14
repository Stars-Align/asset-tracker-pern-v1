import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 8000;

// 本地启动逻辑
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('⚡️ Local: Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Local Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Local: Startup failed:', error);
    }
}

startServer();