const Notification = require("../models/notification");

// Create a new notification
const createNotification = async (type, title, message, productId = null, userId = null) => {
    try {
        const notification = new Notification({
            type,
            title,
            message,
            productId,
            userId,
            read: false
        });
        await notification.save();
        console.log(`✅ Notification created: ${title}`);
        return notification;
    } catch (error) {
        console.error("❌ Error creating notification:", error);
        return null;
    }
};

// Get all notifications
const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get unread notifications
const getUnreadNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ read: false })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ read: false }, { read: true });
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get notification count
const getNotificationCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({ read: false });
        const totalCount = await Notification.countDocuments();
        res.json({ unread: unreadCount, total: totalCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createNotification,
    getAllNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationCount
};
