const notifRepo = require('../repositories/notification.repository');
const db = require('../config/db');

const notify = async (userId, title, message) => {
    return notifRepo.create(userId, title, message);
};

const notifyMany = async (userIds, title, message) => {
    const notifications = userIds.map(userId => ({ userId, title, message }));
    return notifRepo.createBulk(notifications);
};

/**
 * Notify a donor about a tracking event (accepted, travelling, arrived, completed)
 * and log it to the notification_logs table.
 */
const notifyTrackingEvent = async (eventType, requestId, donorUserId, hospitalUserId, donorName, hospitalName, details = {}) => {
    const messages = {
        accepted: {
            title: '✅ Donation Request Accepted',
            message: `${donorName} has accepted the blood request #${requestId}. They are on their way.`,
        },
        travelling: {
            title: '🚗 Donor En Route',
            message: `${donorName} is travelling to ${hospitalName} for request #${requestId}. Estimated arrival: ${details.eta || 'unknown'}.`,
        },
        arrived: {
            title: '📍 Donor Arrived',
            message: `${donorName} has arrived at ${hospitalName} for request #${requestId}.`,
        },
        completed: {
            title: '🎉 Donation Completed',
            message: `${donorName} has successfully donated blood for request #${requestId} at ${hospitalName}.`,
        },
    };

    const msg = messages[eventType];
    if (!msg) throw new Error(`Unknown tracking event: ${eventType}`);

    // Notify hospital
    await notify(hospitalUserId, msg.title, msg.message);
    await db.query(
        `INSERT INTO notification_logs (request_id, sender_id, recipient_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [requestId, donorUserId, hospitalUserId, `donor_${eventType}`, msg.title, msg.message]
    );

    // Notify donor
    const donorMessages = {
        accepted: {
            title: '✅ Request Accepted',
            message: `You have accepted blood request #${requestId} at ${hospitalName}. Please head to the location.`,
        },
        travelling: {
            title: '🚗 Safe Travels!',
            message: `You are on your way to ${hospitalName} for request #${requestId}. Drive safely!`,
        },
        arrived: {
            title: '📍 You\'ve Arrived',
            message: `You have arrived at ${hospitalName} for request #${requestId}. Please check in at reception.`,
        },
        completed: {
            title: '🎉 Thank You for Donating!',
            message: `Your donation at ${hospitalName} for request #${requestId} is complete. You are a hero!`,
        },
    };

    const donorMsg = donorMessages[eventType];
    if (donorMsg) {
        await notify(donorUserId, donorMsg.title, donorMsg.message);
    }
};

const logSentNotification = async (requestId, senderId, recipientId, type, title, message) => {
    await db.query(
        `INSERT INTO notification_logs (request_id, sender_id, recipient_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [requestId, senderId, recipientId, type, title, message]
    );
};

module.exports = { notify, notifyMany, notifyTrackingEvent, logSentNotification };
