import { ForbiddenError } from './errorHandler.js';

export const isAdmin = (req, res, next) => {
    // Assuming req.user is populated by authenticate middleware
    if (!req.user || !req.user.is_admin) {
        throw new ForbiddenError('Access denied. Admin privileges required.');
    }
    next();
};
