const notifRepo = require('../repositories/notification.repository');

const notify = async (userId, title, message) => {
    return notifRepo.create(userId, title, message);
};

const notifyMany = async (userIds, title, message) => {
    const notifications = userIds.map(userId => ({ userId, title, message }));
    return notifRepo.createBulk(notifications);
};

module.exports = { notify, notifyMany };
