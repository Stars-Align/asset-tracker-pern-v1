
import sequelize from './src/config/database.js';

console.log('Testing DB connection...');
try {
    await sequelize.authenticate();
    console.log('✓ Connection has been established successfully.');
} catch (error) {
    console.error('✗ Unable to connect to the database:', error);
}
