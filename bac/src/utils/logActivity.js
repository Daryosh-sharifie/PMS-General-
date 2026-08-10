const prisma = require('../DBconfig/Prisma');

/**
 * Log an activity to the database.
 * Never throws — logging must never break the main request flow.
 */
const logActivity = async ({ action, entity, entityId, description, userId, userName, userRole }) => {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        entityId: entityId ? parseInt(entityId) : null,
        description,
        userId: userId ? parseInt(userId) : null,
        userName: userName || null,
        userRole: userRole || null,
      },
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
