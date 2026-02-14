import { Category } from '../models/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
        });

        res.json({
            success: true,
            data: { categories },
        });
    } catch (error) {
        next(error);
    }
};

export const getCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!category) {
            throw new NotFoundError('Category not found');
        }

        res.json({
            success: true,
            data: { category },
        });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const { name, icon } = req.body;

        const category = await Category.create({
            name,
            icon: icon || null,
            user_id: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category },
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, icon } = req.body;

        const category = await Category.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!category) {
            throw new NotFoundError('Category not found');
        }

        if (name !== undefined) category.name = name;
        if (icon !== undefined) category.icon = icon;

        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: { category },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!category) {
            throw new NotFoundError('Category not found');
        }

        await category.destroy();

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
