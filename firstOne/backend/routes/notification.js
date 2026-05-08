const express = require("express");
const router = express.Router();
const { 
    getAllNotifications, 
    getUnreadNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    getNotificationCount
} = require("../controllers/notification");

router.get("/all", getAllNotifications);
router.get("/unread", getUnreadNotifications);
router.get("/count", getNotificationCount);
router.put("/:id/read", markAsRead);
router.put("/all/read", markAllAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
