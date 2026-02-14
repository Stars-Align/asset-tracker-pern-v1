import { Sequelize } from 'sequelize';
import { config } from './env.js';

const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
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
            timestamps: false, // We'll manually define timestamps
            underscored: true, // Use snake_case for auto-generated fields
        },
    }
);

export default sequelize;
