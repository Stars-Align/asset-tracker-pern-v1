import { Profile, Item, Location } from '../models/index.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { Op } from 'sequelize';

export const getStats = async (req, res, next) => {
    try {
        const totalUsers = await Profile.count();

        // Count Pro Users (where pro_expiry is in the future)
        const totalProUsers = await Profile.count({
            where: {
                pro_expiry: {
                    [Op.gt]: new Date()
                }
            }
        });

        const PRO_PRICE = 9.99; // Assuming $9.99/month for estimation
        const totalMoney = totalProUsers * PRO_PRICE;

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProUsers,
                totalMoney
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await Profile.findAll({
            attributes: ['id', 'email', 'full_name', 'avatar_url', 'is_admin', 'created_at', 'pro_start_date', 'pro_expiry'],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                users
            }
        });
    } catch (error) {
        next(error);
    }
};

export const toggleSubscription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pro' or 'free'

        const user = await Profile.findByPk(id);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (status === 'pro') {
            // Activate Pro (Set for 30 days)
            const now = new Date();
            const expiry = new Date();
            expiry.setDate(now.getDate() + 30);

            await user.update({
                pro_start_date: now,
                pro_expiry: expiry
            });
        } else {
            // Deactivate Pro (Clear dates)
            await user.update({
                pro_start_date: null,
                pro_expiry: null
            });
        }

        res.json({
            success: true,
            message: `User subscription updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await Profile.findByPk(id);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (user.is_admin) {
            throw new BadRequestError('Cannot delete an admin user');
        }

        await user.destroy();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
