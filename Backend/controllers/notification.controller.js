const notifRepo = require('../repositories/notification.repository');
const res_      = require('../utils/responseHandler');

const getNotifications = async (req, res, next) => {
    try {
        const notifications = await notifRepo.findByUserId(req.user.userId);
        const unread        = await notifRepo.unreadCount(req.user.userId);
        return res_.success(res, { notifications, unread_count: unread });
    } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
    try {
        const notif = await notifRepo.markRead(parseInt(req.params.id), req.user.userId);
        if (!notif) return res_.error(res, 'Notification not found', 404);
        return res_.success(res, notif, 'Marked as read');
    } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
    try {
        await notifRepo.markAllRead(req.user.userId);
        return res_.success(res, {}, 'All notifications marked as read');
    } catch (err) { next(err); }
};

const deleteNotification = async (req, res, next) => {
    try {
        const deleted = await notifRepo.deleteById(parseInt(req.params.id), req.user.userId);
        if (!deleted) return res_.error(res, 'Notification not found', 404);
        return res_.success(res, {}, 'Notification deleted');
    } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
