
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize('asset_tracker', 'postgres', 'Yps=20051015', {
    host: '127.0.0.1',
    port: 5432,
    dialect: 'postgres',
    logging: false,
});

const Profile = sequelize.define('profiles', {
    id: { type: DataTypes.UUID, primaryKey: true },
    email: { type: DataTypes.STRING },
    pro_expiry: { type: DataTypes.DATE },
}, { timestamps: false });

async function checkUser() {
    try {
        await sequelize.authenticate();
        const user = await Profile.findOne({ where: { email: 'p9386415@gmail.com' } });
        console.log("User found:", user ? user.toJSON() : "Not found");
        await sequelize.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkUser();
