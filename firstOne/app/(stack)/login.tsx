import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useUserStore } from "../store/user.native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Use store
    const userStore = useUserStore();
    const login = userStore.login;
    const fingerprintLogin = userStore.fingerprintLogin;
    const isLoading = userStore.isLoading;
    const error = userStore.error;
    
    // Debug check
    console.log("🔍 Store methods:", {
        login: typeof login,
        fingerprintLogin: typeof fingerprintLogin,
        isLoading: typeof isLoading,
        error: typeof error
    });
    
    const handleFingerprintAuth = async () => {
        try {
            // Check if hardware supports biometric authentication
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            
            if (!hasHardware) {
                Alert.alert("Error", "Biometric authentication is not supported on this device");
                return;
            }

            // Check if user has enrolled biometrics
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            
            if (!isEnrolled) {
                Alert.alert("Error", "No biometrics enrolled. Please set up fingerprint or face ID in your device settings");
                return;
            }

            // Authenticate with fingerprint only
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Login with Fingerprint",
                fallbackLabel: "Use Password",
                cancelLabel: "Cancel",
            });

            if (result.success) {
                // Direct login with fingerprint - no credentials needed
                if (typeof fingerprintLogin === 'function') {
                    try {
                        await fingerprintLogin();
                        Alert.alert("Success", "Successfully logged in with fingerprint!");
                        router.replace("/");
                    } catch (error) {
                        console.error("Fingerprint login error:", error);
                        Alert.alert("Error", "Failed to login with fingerprint");
                    }
                } else {
                    Alert.alert("Error", "Fingerprint login not available");
                }
            } else {
                Alert.alert("Error", "Fingerprint authentication failed");
            }
        } catch (error) {
            console.error("Fingerprint auth error:", error);
            Alert.alert("Error", "Failed to authenticate with fingerprint");
        }
    };

    const handleSubmit = async () => {
        if (!username || !password) {
            return;
        }
        
        const success = await login(username, password);
        if (success) {
            router.replace("/");
        }
    };
    
    return (
        <SafeAreaView className="flex-1 bg-blue-600" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <View className="flex-1 justify-center px-6">
                <View className="bg-white rounded-xl p-6 shadow-lg">
                <Text className="text-2xl font-bold text-blue-700 text-center mb-6">Login</Text>
                
                {error && (
                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                )}

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-blue-500 mb-2">Username</Text>
                    <TextInput 
                        className="border-b-2 border-blue-500 py-2 text-gray-800"
                        value={username} 
                        onChangeText={setUsername} 
                        placeholder="Enter username"
                        autoCapitalize="none"
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-semibold text-blue-500 mb-2">Password</Text>
                    <TextInput 
                        className="border-b-2 border-blue-500 py-2 text-gray-800"
                        value={password} 
                        onChangeText={setPassword} 
                        placeholder="Enter password"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity 
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-blue-700'}`}
                    onPress={handleSubmit}
                >
                    <Text className="text-white font-bold text-center">
                        {isLoading ? 'Loading...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/register' as any)}
                    className="mt-4"
                >
                    <Text className="text-blue-600 text-center text-sm">Don't have an account? Register</Text>
                </TouchableOpacity>

                {/* Fingerprint Login Option */}
                <View className="mt-6 pt-4 border-t border-gray-200">
                    <TouchableOpacity
                        onPress={handleFingerprintAuth}
                        className="flex-row items-center justify-center py-3"
                    >
                        <Text className="text-2xl mr-2">👆</Text>
                        <Text className="text-blue-600 text-center font-semibold">Login with Fingerprint</Text>
                    </TouchableOpacity>
                </View>

                {/* Media Recorder Link */}
                <View className="mt-4">
                    <TouchableOpacity
                        onPress={() => router.push('/media-recorder' as any)}
                        className="flex-row items-center justify-center py-3 bg-green-100 rounded-lg"
                    >
                        <Text className="text-2xl mr-2">🎙️🎥️</Text>
                        <Text className="text-green-600 text-center font-semibold">Media Recorder</Text>
                    </TouchableOpacity>
                </View>

                {/* Admin Panel Link */}
                <View className="mt-4">
                    <TouchableOpacity
                        onPress={() => router.push('/admin-panel' as any)}
                        className="flex-row items-center justify-center py-3 bg-purple-100 rounded-lg"
                    >
                        <Text className="text-2xl mr-2">🛠️</Text>
                        <Text className="text-purple-600 text-center font-semibold">Admin Panel</Text>
                    </TouchableOpacity>
                </View>
            </View>
            </View>
        </SafeAreaView>
    );
}
