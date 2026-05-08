import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="about" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="product/index" />
      <Stack.Screen name="product/simple" />
      <Stack.Screen name="product/[id]/page" />
      <Stack.Screen name="testDevice/index" />
      <Stack.Screen name="media-recorder" />
      <Stack.Screen name="admin-panel" />
      <Stack.Screen name="test-ip" />
      <Stack.Screen name="test-network" />
    </Stack>
  );
}
