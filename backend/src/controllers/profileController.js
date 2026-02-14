import { Profile } from '../models/index.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export const getProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Multi-tenant check: users can only access their own profile
        if (id !== req.user.id) {
            throw new ForbiddenError('You can only access your own profile');
        }

        const profile = await Profile.findByPk(id, {
            attributes: ['id', 'email', 'full_name', 'avatar_url', 'updated_at'],
        });

        if (!profile) {
            throw new NotFoundError('Profile not found');
        }

        res.json({
            success: true,
            data: { profile },
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { full_name, avatar_url } = req.body;

        // Multi-tenant check
        if (id !== req.user.id) {
            throw new ForbiddenError('You can only update your own profile');
        }

        const profile = await Profile.findByPk(id);

        if (!profile) {
            throw new NotFoundError('Profile not found');
        }

        // Update fields
        if (full_name !== undefined) profile.full_name = full_name;
        if (avatar_url !== undefined) profile.avatar_url = avatar_url;

        await profile.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: {
                    id: profile.id,
                    email: profile.email,
                    full_name: profile.full_name,
                    avatar_url: profile.avatar_url,
                    updated_at: profile.updated_at,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
