import { sequelize } from '../models/index.js';

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connection successful!');
        console.log('✓ Connection details:');
        console.log(`  - Host: ${sequelize.config.host}`);
        console.log(`  - Database: ${sequelize.config.database}`);
        console.log(`  - Port: ${sequelize.config.port}`);

        process.exit(0);
    } catch (error) {
        console.error('✗ Unable to connect to the database:');
        console.error(error.message);
        process.exit(1);
    }
};

testConnection();
