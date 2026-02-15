// backend/src/config/database.js
import { Sequelize } from 'sequelize';
import pg from 'pg'; 
import { config } from './env.js';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;

// 🌟 核心修复逻辑：优先判断是否存在 DATABASE_URL (Vercel 生产环境)
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
    // 🚀 情况 A: 生产环境 (Vercel + Neon)
    console.log("✅ Using DATABASE_URL for connection");
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        dialectModule: pg, // 必须显式指定 pg
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // 必须允许自签名证书
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: false,
            underscored: true
        }
    });
} else {
    // 🏠 情况 B: 本地开发环境 (Fallback)
    console.log("⚠️ No DATABASE_URL found, using individual config params");
    sequelize = new Sequelize(
        config.database.name,
        config.database.user,
        config.database.password,
        {
            host: config.database.host || '127.0.0.1', // 这就是之前报错的源头
            port: config.database.port || 5432,
            dialect: 'postgres',
            dialectModule: pg,
            logging: console.log,
            // 本地通常不需要 SSL，或者根据你的配置决定
            dialectOptions: {}, 
            define: {
                timestamps: false,
                underscored: true
            }
        }
    );
}

export default sequelize;