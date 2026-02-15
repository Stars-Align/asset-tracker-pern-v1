import { Sequelize } from 'sequelize';
import pg from 'pg'; // 👈 1. 关键修改：显式导入 pg 驱动
import { config } from './env.js';

const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
        
        // 👈 2. 关键修改：强制 Sequelize 使用我们导入的 pg 模块
        // 这解决了 Vercel 找不到驱动的问题
        dialectModule: pg, 

        logging: config.nodeEnv === 'development' ? console.log : false,
        dialectOptions: config.nodeEnv === 'production' ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: false,
            underscored: true,
        },
    }
);

export default sequelize;