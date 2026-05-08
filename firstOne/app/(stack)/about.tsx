import { useRouter } from "expo-router";
import { Button, View, Text, SafeAreaView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function About() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    return (
        <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View className="flex-1 p-6 justify-center items-center">
                <Text className="text-3xl font-bold text-gray-800 mb-6">About</Text>
                <Text className="text-gray-600 text-center mb-8">This is a demo application built with Expo Router and React Native.</Text>
                <Button title="Go to Home" onPress={() => router.replace("/")} />
            </View>
        </SafeAreaView>
    );
}