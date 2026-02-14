import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    serial_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    warranty_expires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    photo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'available',
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Legacy/denormalized category name',
    },
    category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    location_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'locations',
            key: 'id',
        },
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'profiles',
            key: 'id',
        },
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    ai_tags: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
    image_vector: {
        type: DataTypes.ARRAY(DataTypes.FLOAT),
        allowNull: true,
    },
    borrower: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    borrower_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    lent_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'items',
    timestamps: false,
});

// Hook to update updated_at on save
Item.beforeUpdate((item) => {
    item.updated_at = new Date();
});

export default Item;
