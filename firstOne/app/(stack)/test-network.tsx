import { View, Text, Button } from "react-native";
import { API_URLS } from "../config/mobile";

export default function TestNetwork() {
  const testConnection = async () => {
    console.log("🔍 Testing network connections...");
    
    for (const url of API_URLS) {
      try {
        console.log(`🌐 Testing: ${url}`);
        const response = await fetch(`${url}/test`);
        console.log(`✅ Success: ${url} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ Failed: ${url} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-lg font-bold mb-4">Network Test</Text>
      <Text className="text-sm text-gray-600 mb-4">
        Testing API connectivity...
      </Text>
      <Button title="Test Connection" onPress={testConnection} />
    </View>
  );
}
