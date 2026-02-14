import sequelize from '../config/database.js';
import Profile from './Profile.js';
import Location from './Location.js';
import Category from './Category.js';
import Item from './Item.js';
import LendingLog from './LendingLog.js';

// Define associations

// Profile associations
Profile.hasMany(Location, { foreignKey: 'user_id', as: 'locations' });
Profile.hasMany(Category, { foreignKey: 'user_id', as: 'categories' });
Profile.hasMany(Item, { foreignKey: 'user_id', as: 'items' });
Profile.hasMany(LendingLog, { foreignKey: 'user_id', as: 'lending_logs' });

// Location associations
Location.belongsTo(Profile, { foreignKey: 'user_id', as: 'owner' });
Location.belongsTo(Location, { foreignKey: 'parent_id', as: 'parent' });
Location.hasMany(Location, { foreignKey: 'parent_id', as: 'children' });
Location.hasMany(Item, { foreignKey: 'location_id', as: 'items' });

// Category associations
Category.belongsTo(Profile, { foreignKey: 'user_id', as: 'owner' });
Category.hasMany(Item, { foreignKey: 'category_id', as: 'items' });

// Item associations
Item.belongsTo(Profile, { foreignKey: 'user_id', as: 'owner' });
Item.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Item.belongsTo(Category, { foreignKey: 'category_id', as: 'category_details' });
Item.hasMany(LendingLog, { foreignKey: 'item_id', as: 'lending_logs' });

// LendingLog associations
LendingLog.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
LendingLog.belongsTo(Profile, { foreignKey: 'user_id', as: 'owner' });

export {
    sequelize,
    Profile,
    Location,
    Category,
    Item,
    LendingLog,
};
