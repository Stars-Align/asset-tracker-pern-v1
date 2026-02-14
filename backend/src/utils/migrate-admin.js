import { sequelize } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateAdmin = async () => {
    try {
        console.log('Starting Admin migration...');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../../migrations/add-is-admin.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL
        await sequelize.query(sql);

        console.log('✓ is_admin column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:');
        console.error(error.message);
        process.exit(1);
    }
};

migrateAdmin();
