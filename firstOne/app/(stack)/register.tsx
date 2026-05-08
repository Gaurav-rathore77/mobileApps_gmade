import { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View, Alert, SafeAreaView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { registerApi } from '../../api/auth';
import { uploadImageFromUriFixed } from '../../api/image-fixed';

interface UserData {
    username?: string;
    email?: string;
    password?: string;
    profileImage?: string;
}

export default function Register() {
    const [data, setData] = useState<UserData>({});
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const pickImage = async () => {
        // Request permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please grant camera roll permissions to select an image");
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setUploadingImage(true);
            try {
                console.log("Uploading image...");
                const imageUrl = await uploadImageFromUriFixed(
                    result.assets[0].uri,
                    `profile-${Date.now()}.jpg`,
                    "/profile-images"
                );
                console.log("Image uploaded successfully:", imageUrl);
                setData({ ...data, profileImage: imageUrl });
                Alert.alert("Success", "Profile image uploaded successfully!");
            } catch (error) {
                console.error("Image upload error:", error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                console.log("🔍 Detailed error:", errorMessage);
                
                // Show more specific error message
                if (errorMessage.includes('Could not connect to any backend server')) {
                    Alert.alert("Connection Error", "Cannot connect to backend server. Please make sure the backend is running on localhost:3000");
                } else if (errorMessage.includes('ImageKit upload failed')) {
                    Alert.alert("Upload Error", "Failed to upload to ImageKit. Please check your internet connection and try again.");
                } else {
                    Alert.alert("Error", `Failed to upload image: ${errorMessage}`);
                }
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleFingerprintRegistration = async () => {
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

            // Authenticate to verify identity before registration
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Verify Identity for Registration",
                fallbackLabel: "Use Manual Registration",
                cancelLabel: "Cancel",
            });

            if (result.success) {
                Alert.alert("Success", "Identity verified! You can now complete registration.");
                // Optionally pre-fill some fields or enable biometric login for future
            } else {
                Alert.alert("Error", "Identity verification failed");
            }
        } catch (error) {
            console.error("Fingerprint registration error:", error);
            Alert.alert("Error", "Failed to verify identity with fingerprint");
        }
    };

    const handleSubmit = async () => {
        if (!data.username || !data.password || !data.email) {
            Alert.alert("Error", "Username, email and password required");
            return;
        }
        
        setLoading(true);
        try {
            const response = await registerApi({
                username: data.username!,
                email: data.email!,
                password: data.password!,
                profileImage: data.profileImage
            });
            
            console.log("Registration successful:", response);
            
            // Redirect to login page
            router.replace("/login");
        } catch (error) {
            console.error("Registration error:", error);
            Alert.alert("Error", "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className='flex-1 bg-indigo-600' style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
            <View className="flex-1 justify-center px-6">
                <View className="bg-white rounded-xl p-6 shadow-lg">
                    {/* Profile Image */}
                    <View className="items-center mb-6">
                        <TouchableOpacity 
                            onPress={pickImage}
                            disabled={uploadingImage}
                            className="relative"
                        >
                            {data.profileImage ? (
                                <Image 
                                    className="w-24 h-24 rounded-full border-4 border-indigo-500"
                                    source={{ uri: data.profileImage }}
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-gray-200 border-4 border-indigo-500 justify-center items-center">
                                    <Text className="text-3xl">📷</Text>
                                </View>
                            )}
                            {uploadingImage && (
                                <View className="absolute inset-0 bg-black bg-opacity-50 rounded-full justify-center items-center">
                                    <Text className="text-white text-sm">Uploading...</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text className="text-sm text-gray-600 mt-2">Tap to add profile photo</Text>
                    </View>

                    {/* Logo */}
                    <View className="items-center mb-6">
                        <Text className="text-2xl font-bold text-indigo-700 mt-2">Register</Text>
                    </View>

                    {/* Username */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-indigo-500 mb-2">Username</Text>
                        <TextInput 
                            className="border-b-2 border-indigo-500 py-2 text-gray-800"
                            value={data.username}
                            onChangeText={(text) => setData({...data, username: text})}
                            placeholder="Enter username"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Email */}
                    <View className="mb-4">
                        <Text className="text-sm font-semibold text-indigo-500 mb-2">Email</Text>
                        <TextInput 
                            className="border-b-2 border-indigo-500 py-2 text-gray-800"
                            value={data.email}
                            onChangeText={(text) => setData({...data, email: text})}
                            placeholder="Enter email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold text-indigo-500 mb-2">Password</Text>
                        <TextInput 
                            className="border-b-2 border-indigo-500 py-2 text-gray-800"
                            secureTextEntry
                            value={data.password}
                            onChangeText={(text) => setData({...data, password: text})}
                            placeholder="Enter password"
                        />
                    </View>

                    {/* Submit */}
                    <TouchableOpacity 
                        disabled={loading}
                        className={`w-full py-3 rounded-lg mb-4 ${loading ? 'bg-gray-400' : 'bg-indigo-700'}`}
                        onPress={handleSubmit}
                    >
                        <Text className="text-white font-bold text-center">
                            {loading ? 'Loading...' : 'Submit'}
                        </Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View className="flex-row justify-between mb-4">
                        <TouchableOpacity onPress={() => router.replace('/login')}>
                            <Text className="text-indigo-600 text-sm">Already have an account?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Fingerprint Registration Option */}
                    <View className="pt-4 border-t border-gray-200">
                        <TouchableOpacity
                            onPress={handleFingerprintRegistration}
                            className="flex-row items-center justify-center py-3"
                        >
                            <Text className="text-2xl mr-2">👆</Text>
                            <Text className="text-indigo-600 text-center font-semibold">Register with Fingerprint</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-500 text-xs text-center mt-2">Verify your identity for faster registration</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}