import { Location } from '../models/index.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const getLocations = async (req, res, next) => {
    try {
        const { parent_id } = req.query;

        const where = { user_id: req.user.id };

        // Filter by parent_id if provided
        if (parent_id !== undefined) {
            where.parent_id = parent_id === 'null' ? null : parent_id;
        }

        const locations = await Location.findAll({
            where,
            include: [
                {
                    model: Location,
                    as: 'children',
                    attributes: ['id', 'name', 'parent_id'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.json({
            success: true,
            data: { locations },
        });
    } catch (error) {
        next(error);
    }
};

export const getLocation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const location = await Location.findOne({
            where: { id, user_id: req.user.id },
            include: [
                {
                    model: Location,
                    as: 'parent',
                    attributes: ['id', 'name'],
                },
                {
                    model: Location,
                    as: 'children',
                    attributes: ['id', 'name', 'parent_id'],
                },
            ],
        });

        if (!location) {
            throw new NotFoundError('Location not found');
        }

        res.json({
            success: true,
            data: { location },
        });
    } catch (error) {
        next(error);
    }
};

export const createLocation = async (req, res, next) => {
    try {
        const { name, parent_id } = req.body;

        // If parent_id is provided, verify it belongs to the user
        if (parent_id) {
            const parent = await Location.findOne({
                where: { id: parent_id, user_id: req.user.id },
            });

            if (!parent) {
                throw new NotFoundError('Parent location not found');
            }
        }

        const location = await Location.create({
            name,
            parent_id: parent_id || null,
            user_id: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Location created successfully',
            data: { location },
        });
    } catch (error) {
        next(error);
    }
};

export const updateLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, parent_id } = req.body;

        const location = await Location.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!location) {
            throw new NotFoundError('Location not found');
        }

        // Prevent setting self as parent
        if (parent_id === id) {
            throw new ForbiddenError('Location cannot be its own parent');
        }

        // If parent_id is provided, verify it belongs to the user
        if (parent_id) {
            const parent = await Location.findOne({
                where: { id: parent_id, user_id: req.user.id },
            });

            if (!parent) {
                throw new NotFoundError('Parent location not found');
            }
        }

        if (name !== undefined) location.name = name;
        if (parent_id !== undefined) location.parent_id = parent_id || null;

        await location.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: { location },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteLocation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const location = await Location.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!location) {
            throw new NotFoundError('Location not found');
        }

        await location.destroy();

        res.json({
            success: true,
            message: 'Location deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
