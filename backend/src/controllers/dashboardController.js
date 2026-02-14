import { Item } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

export const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get all items for calculations
        const items = await Item.findAll({
            where: { user_id: userId },
            attributes: ['price', 'status', 'due_date'],
        });

        // Calculate total value (sum of all item prices)
        const totalValue = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) || 0);
        }, 0);

        // Calculate financial loss (sum of prices for lost or damaged items)
        const financialLoss = items
            .filter(item => item.status === 'lost' || item.status === 'damaged')
            .reduce((sum, item) => {
                return sum + (parseFloat(item.price) || 0);
            }, 0);

        // Calculate overdue count (lent items past due date)
        const now = new Date();
        const overdueCount = items.filter(item => {
            return item.status === 'lent' &&
                item.due_date &&
                new Date(item.due_date) < now;
        }).length;

        // Total items count
        const totalItems = items.length;

        // Additional useful stats
        const statusBreakdown = {
            available: items.filter(i => i.status === 'available').length,
            lent: items.filter(i => i.status === 'lent').length,
            lost: items.filter(i => i.status === 'lost').length,
            damaged: items.filter(i => i.status === 'damaged').length,
        };

        res.json({
            success: true,
            data: {
                totalValue: parseFloat(totalValue.toFixed(2)),
                financialLoss: parseFloat(financialLoss.toFixed(2)),
                overdueCount,
                totalItems,
                statusBreakdown,
            },
        });
    } catch (error) {
        next(error);
    }
};
