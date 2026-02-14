import app from './src/app.js';
import { config } from './src/config/env.js';
import { sequelize } from './src/models/index.js';

const startServer = async () => {
    try {
        // Test database connection and sync models
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Database synced');

        // Start server
        if (process.env.NODE_ENV !== 'production') {
            app.listen(config.port, () => {
                console.log(`✓ Server running on http://localhost:${config.port}`);
                console.log(`✓ Environment: ${config.nodeEnv}`);
                console.log(`✓ API Health: http://localhost:${config.port}/health`);
            });
        }
    } catch (error) {
        console.error('✗ Unable to start server:', error);
        // Log to file for debugging
        if (process.env.NODE_ENV !== 'production') {
            const fs = await import('fs');
            fs.writeFileSync('startup_error.txt', `Error: ${error.message}\nStack: ${error.stack}\n`);
            process.exit(1);
        }
    }
};

// Start the database connection (and server if local)
startServer();

// Export the app for Vercel
export default app;
