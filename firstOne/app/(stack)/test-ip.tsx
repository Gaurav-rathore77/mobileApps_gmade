import { View, Text } from "react-native";

export default function TestIP() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-lg font-bold mb-4">IP Test Page</Text>
      <Text className="text-sm">Backend IP: 192.168.1.8:3000</Text>
      <Text className="text-sm">If you can see this page, routing is working!</Text>
    </View>
  );
}
