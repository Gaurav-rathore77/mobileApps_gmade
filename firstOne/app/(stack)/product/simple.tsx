import { View, Text, Button } from "react-native";

export default function SimpleProduct() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Simple Product Page</Text>
      <Text className="text-gray-600 mb-4">This is a test to see if basic product page works.</Text>
      <Button title="Test Button" onPress={() => console.log("Button pressed")} />
    </View>
  );
}
