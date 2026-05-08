import { Text, TouchableOpacity, View, ScrollView, Modal, Image, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useUserStore } from "../store/user.native";
import { useState, useEffect } from "react";
import { notificationApi, Notification } from "../../api/notification";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Sidebar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const navItem = (label: string, route: any, icon: string) => (
    <TouchableOpacity
      onPress={() => { router.push(route); onClose(); }}
      className="px-4 py-4 border-b border-gray-100 flex-row items-center"
    >
      <Text className="text-2xl mr-4">{icon}</Text>
      <Text className="text-gray-800 font-medium text-lg">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}
          onPress={onClose}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "75%",
            backgroundColor: "white",
            zIndex: 2,
          }}
        >
          <View className="bg-indigo-600 p-6 rounded-t-3xl flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              {user?.profileImage && (
                <Image 
                  source={{ uri: user.profileImage }} 
                  className="w-12 h-12 rounded-full mr-3"
                />
              )}
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">
                  {user ? user.username : "My App"}
                </Text>
                <Text className="text-indigo-200 text-sm mt-1">{user ? "Logged In" : "Guest"}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}><Text className="text-white text-2xl">✕</Text></TouchableOpacity>
          </View>
          <ScrollView className="flex-1">
            {navItem("Home", "/", "🏠")}
            {navItem("Products", "/product" as any, "📦")}
            {navItem("About", "/about" as any, "ℹ️")}
            {user && <>{navItem("Admin Panel", "/admin" as any, "⚙️")}</>}
            <View className="p-4 mt-4">
              {user ? (
                <TouchableOpacity onPress={() => { logout(); onClose(); }} className="bg-red-500 py-4 rounded-lg">
                  <Text className="text-white text-center font-semibold">Logout</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity onPress={() => { router.replace("/login" as any); onClose(); }} className="bg-blue-600 py-4 rounded-lg mb-3">
                    <Text className="text-white text-center font-semibold">Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { router.replace("/register" as any); onClose(); }} className="bg-green-500 py-4 rounded-lg">
                    <Text className="text-white text-center font-semibold">Register</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminPanel() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [allNotifs, count] = await Promise.all([
        notificationApi.getAllNotifications(),
        notificationApi.getNotificationCount()
      ]);
      setNotifications(allNotifs);
      setUnreadCount(count.unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await notificationApi.markAsRead(notificationId);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    fetchNotifications();
  };

  const deleteNotification = async (notificationId: string) => {
    await notificationApi.deleteNotification(notificationId);
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'product_created': return '📦';
      case 'product_updated': return '✏️';
      case 'user_registered': return '👤';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const navButton = (label: string, route: any, color: string = "bg-blue-500") => (
    <TouchableOpacity
      className={`${color} px-4 py-3 rounded-lg mb-3 w-full`}
      onPress={() => router.push(route)}
    >
      <Text className="text-white text-center font-semibold">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header with Hamburger and Notification Bell */}
      <View className="bg-indigo-600 py-4 px-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            className="p-2 bg-white/20 rounded-lg mr-4"
          >
            <Text className="text-2xl text-white">☰</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-white">⚙️ Admin</Text>
            <Text className="text-indigo-100 text-xs">
              {user ? user.username : "Guest"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setNotificationModalOpen(true)}
          className="p-2 bg-white/20 rounded-lg relative"
        >
          <Text className="text-2xl text-white">🔔</Text>
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* User Info Card */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            👤 Current User
          </Text>
          {user ? (
            <>
              <View className="mb-2">
                <Text className="text-gray-500 text-sm">Username</Text>
                <Text className="text-gray-800 font-semibold">{user.username}</Text>
              </View>
              <View className="mb-2">
                <Text className="text-gray-500 text-sm">User ID</Text>
                <Text className="text-gray-400 text-xs">{user.id}</Text>
              </View>
            </>
          ) : (
            <Text className="text-red-500">Not logged in</Text>
          )}
        </View>

        {/* Product Management */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            📦 Product Management
          </Text>
          {navButton("View All Products", "/product/index?mode=view" as any, "bg-purple-500")}
          {navButton("Add New Product", "/product/index?mode=add" as any, "bg-indigo-500")}
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            ⚡ Quick Actions
          </Text>
          {navButton("Go to Home", "/", "bg-blue-500")}
          {navButton("About App", "/about" as any, "bg-gray-600")}
        </View>

        {/* Logout Section */}
        {user && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              🚪 Session
            </Text>
            <TouchableOpacity
              onPress={logout}
              className="bg-red-500 px-4 py-3 rounded-lg w-full"
            >
              <Text className="text-white text-center font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalOpen}
        onRequestClose={() => setNotificationModalOpen(false)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
            }}
            onPress={() => setNotificationModalOpen(false)}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              width: "100%",
              height: "80%",
              backgroundColor: "white",
              zIndex: 2,
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
            }}
          >
            <View className="bg-indigo-600 p-4 rounded-b-3xl flex-row justify-between items-center">
              <Text className="text-xl font-bold text-white">🔔 Notifications</Text>
              <View className="flex-row items-center">
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    className="bg-white/20 px-3 py-1 rounded-lg mr-3"
                  >
                    <Text className="text-white text-sm">Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotificationModalOpen(false)}>
                  <Text className="text-white text-2xl">✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView className="flex-1 p-4">
              {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20">
                  <Text className="text-4xl mb-4">📭</Text>
                  <Text className="text-gray-500 text-lg">No notifications yet</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification._id}
                    onPress={() => markAsRead(notification._id)}
                    className={`p-4 mb-3 rounded-xl ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                    }`}
                  >
                    <View className="flex-row items-start">
                      <Text className="text-2xl mr-3">{getNotificationIcon(notification.type)}</Text>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                          <Text className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </Text>
                          <Text className="text-xs text-gray-500">{formatTime(notification.createdAt)}</Text>
                        </View>
                        <Text className="text-gray-600 text-sm mt-1">{notification.message}</Text>
                        <View className="flex-row justify-between items-center mt-2">
                          <Text className="text-xs text-gray-400">
                            {notification.read ? '✓ Read' : '🔵 Unread'}
                          </Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="bg-red-100 px-2 py-1 rounded"
                          >
                            <Text className="text-red-600 text-xs">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
