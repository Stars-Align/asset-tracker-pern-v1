import { sequelize } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
    try {
        console.log('Starting database migration...');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../../migrations/init-schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL
        await sequelize.query(sql);

        console.log('✓ Database schema created successfully!');
        console.log('✓ All tables have been initialized');

        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:');
        console.error(error.message);
        process.exit(1);
    }
};

migrate();
