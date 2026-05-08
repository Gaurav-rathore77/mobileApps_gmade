import { API_URLS } from '../app/config/mobile';

export interface Notification {
  _id: string;
  type: 'product_created' | 'product_updated' | 'user_registered' | 'system';
  title: string;
  message: string;
  productId?: string;
  userId?: string;
  read: boolean;
  createdAt: string;
}

export const notificationApi = {
  // Get all notifications
  getAllNotifications: async (): Promise<Notification[]> => {
    try {
      for (const url of API_URLS) {
        try {
          const response = await fetch(`${url}/notification/all`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log(`Failed to fetch from ${url}`);
        }
      }
      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Get unread notifications
  getUnreadNotifications: async (): Promise<Notification[]> => {
    try {
      for (const url of API_URLS) {
        try {
          const response = await fetch(`${url}/notification/unread`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log(`Failed to fetch from ${url}`);
        }
      }
      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  },

  // Get notification count
  getNotificationCount: async (): Promise<{ unread: number; total: number }> => {
    try {
      for (const url of API_URLS) {
        try {
          const response = await fetch(`${url}/notification/count`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.log(`Failed to fetch from ${url}`);
        }
      }
      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return { unread: 0, total: 0 };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      for (const url of API_URLS) {
        try {
          const response = await fetch(`${url}/notification/${notificationId}/read`, {
            method: 'PUT',
          });
          if (response.ok) {
            return;
          }
        } catch (error) {
          console.log(`Failed to fetch from ${url}`);
        }
      }
      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      for (const url of API_URLS) {
        try {
          const response = await fetch(`${url}/notification/all/read`, {
            method: 'PUT',
          });
          if (response.ok) {
            return;
          }
        } catch (error) {
          console.log(`Failed to fetch from ${url}`);
        }
      }
      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      for (const url of API_URLS) {
        try {
          const response = await fetch(`${url}/notification/${notificationId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            return;
          }
        } catch (error) {
          console.log(`Failed to fetch from ${url}`);
        }
      }
      throw new Error('All API endpoints failed');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },
};
