import { Item, Category, Location, LendingLog } from '../models/index.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { Op } from 'sequelize';

export const getItems = async (req, res, next) => {
    try {
        const { status, category_id, location_id, search, page = 1, limit = 50 } = req.query;

        const where = { user_id: req.user.id };

        // Apply filters
        if (status) where.status = status;
        if (category_id) where.category_id = category_id;
        if (location_id) {
            if (location_id.includes(',')) {
                where.location_id = { [Op.in]: location_id.split(',') };
            } else {
                where.location_id = location_id;
            }
        }
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { serial_number: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: items } = await Item.findAndCountAll({
            where,
            include: [
                {
                    model: Category,
                    as: 'category_details',
                    attributes: ['id', 'name', 'icon'],
                },
                {
                    model: Location,
                    as: 'location',
                    attributes: ['id', 'name'],
                },
            ],
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']],
        });

        res.json({
            success: true,
            data: {
                items,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await Item.findOne({
            where: { id, user_id: req.user.id },
            include: [
                {
                    model: Category,
                    as: 'category_details',
                    attributes: ['id', 'name', 'icon'],
                },
                {
                    model: Location,
                    as: 'location',
                    include: [
                        {
                            model: Location,
                            as: 'parent',
                        },
                    ],
                },
                {
                    model: LendingLog,
                    as: 'lending_logs',
                    order: [['created_at', 'DESC']],
                    limit: 10,
                },
            ],
        });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        res.json({
            success: true,
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const createItem = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            quantity,
            serial_number,
            warranty_expires,
            photo_url,
            status,
            category,
            category_id,
            location_id,
            ai_tags,
            image_vector,
        } = req.body;

        // Verify category belongs to user if provided
        if (category_id) {
            const categoryExists = await Category.findOne({
                where: { id: category_id, user_id: req.user.id },
            });
            if (!categoryExists) {
                throw new NotFoundError('Category not found');
            }
        }

        // Verify location belongs to user if provided
        if (location_id) {
            const locationExists = await Location.findOne({
                where: { id: location_id, user_id: req.user.id },
            });
            if (!locationExists) {
                throw new NotFoundError('Location not found');
            }
        }

        const item = await Item.create({
            name,
            description: description || null,
            price: price || null,
            quantity: quantity || 1,
            serial_number: serial_number || null,
            warranty_expires: warranty_expires || null,
            photo_url: photo_url || null,
            status: status || 'available',
            category: category || null,
            category_id: category_id || null,
            location_id: location_id || null,
            user_id: req.user.id,
            ai_tags: ai_tags || [],
            image_vector: image_vector || null,
        });

        res.status(201).json({
            success: true,
            message: 'Item created successfully',
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const item = await Item.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        // Verify category belongs to user if being updated
        if (updateData.category_id) {
            const categoryExists = await Category.findOne({
                where: { id: updateData.category_id, user_id: req.user.id },
            });
            if (!categoryExists) {
                throw new NotFoundError('Category not found');
            }
        }

        // Verify location belongs to user if being updated
        if (updateData.location_id) {
            const locationExists = await Location.findOne({
                where: { id: updateData.location_id, user_id: req.user.id },
            });
            if (!locationExists) {
                throw new NotFoundError('Location not found');
            }
        }

        await item.update(updateData);

        res.json({
            success: true,
            message: 'Item updated successfully',
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await Item.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        await item.destroy();

        res.json({
            success: true,
            message: 'Item deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const lendItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { borrower, borrower_note, due_date } = req.body;

        if (!borrower) {
            throw new BadRequestError('Borrower name is required');
        }

        const item = await Item.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        if (item.status === 'lent') {
            throw new BadRequestError('Item is already lent out');
        }

        // Update item
        await item.update({
            status: 'lent',
            borrower,
            borrower_note: borrower_note || null,
            lent_at: new Date(),
            due_date: due_date || null,
        });

        // Create lending log
        await LendingLog.create({
            item_id: item.id,
            user_id: req.user.id,
            borrower,
            due_date: due_date || null,
        });

        res.json({
            success: true,
            message: 'Item lent successfully',
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const returnItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await Item.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!item) {
            throw new NotFoundError('Item not found');
        }

        if (item.status !== 'lent') {
            throw new BadRequestError('Item is not currently lent out');
        }

        // Update the most recent lending log
        const lendingLog = await LendingLog.findOne({
            where: {
                item_id: item.id,
                returned_at: null,
            },
            order: [['created_at', 'DESC']],
        });

        if (lendingLog) {
            await lendingLog.update({ returned_at: new Date() });
        }

        // Update item
        await item.update({
            status: 'available',
            borrower: null,
            borrower_note: null,
            lent_at: null,
            due_date: null,
        });

        res.json({
            success: true,
            message: 'Item returned successfully',
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const batchUpdateCategory = async (req, res, next) => {
    try {
        const { oldCategoryName, newCategoryName } = req.body;

        if (!newCategoryName) {
            throw new BadRequestError('New category name is required');
        }

        const where = { user_id: req.user.id };

        if (!oldCategoryName || oldCategoryName === 'Uncategorized') {
            // Match null or 'Uncategorized'
            where[Op.or] = [
                { category: null },
                { category: 'Uncategorized' }
            ];
        } else {
            where.category = oldCategoryName;
        }

        await Item.update(
            { category: newCategoryName },
            { where }
        );

        res.json({
            success: true,
            message: 'Items updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const batchClearCategory = async (req, res, next) => {
    try {
        const { categoryName } = req.body;

        if (!categoryName) {
            throw new BadRequestError('Category name is required');
        }

        await Item.update(
            { category: null },
            {
                where: {
                    user_id: req.user.id,
                    category: categoryName
                }
            }
        );

        res.json({
            success: true,
            message: 'Items uncategorized successfully'
        });
    } catch (error) {
        next(error);
    }
};
