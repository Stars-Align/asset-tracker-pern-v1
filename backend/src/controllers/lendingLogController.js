import { LendingLog, Item } from '../models/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { Op } from 'sequelize';

export const getLendingLogs = async (req, res, next) => {
    try {
        const { item_id, start_date, end_date } = req.query;

        const where = { user_id: req.user.id };

        if (item_id) where.item_id = item_id;

        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) where.created_at[Op.gte] = new Date(start_date);
            if (end_date) where.created_at[Op.lte] = new Date(end_date);
        }

        const logs = await LendingLog.findAll({
            where,
            include: [
                {
                    model: Item,
                    as: 'item',
                    attributes: ['id', 'name', 'photo_url'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.json({
            success: true,
            data: { logs },
        });
    } catch (error) {
        next(error);
    }
};

export const getItemLendingLogs = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify item belongs to user
        const item = await Item.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        const logs = await LendingLog.findAll({
            where: { item_id: id },
            order: [['created_at', 'DESC']],
        });

        res.json({
            success: true,
            data: { logs },
        });
    } catch (error) {
        next(error);
    }
};
