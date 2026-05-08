import { View, Text, TouchableOpacity, Image, Alert, ScrollView, SafeAreaView, StatusBar } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { TextInput } from "react-native";
import { Button } from "@react-navigation/elements";
import { useUserStore } from "../store/user.native";
import { loginApi } from "../../api/auth";
import { uploadImageFromUriFixed } from "../../api/image-fixed";
import { getWorkingProfileImage, getAlternativeImageUrl, forceRefreshImageUrl, getOriginalImageUrl } from "../utils/profileImages";
import { getProxyImageUrl } from "../../api/image-proxy";
import { API_URLS } from "../config/mobile";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Profile() {
    const user = useUserStore((s) => s.user);
    const logout = useUserStore((s) => s.logout);
    const updateUser = useUserStore((s) => s.updateUser);
    const insets = useSafeAreaInsets();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [username, setUsername] = useState("");
    const [imageError, setImageError] = useState(false);
    const [imageRetryCount, setImageRetryCount] = useState(0);
    const [proxyUrl, setProxyUrl] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setUsername(user.username);
                        
            // Force refresh user data if profile image has typo
            if (user.profileImage && user.profileImage.includes('profiless')) {
                console.log("❌ Found typo in user store URL: 'profiless' instead of 'profiles'");
                console.log("🔄 Please logout and login again to get fresh data");
                
                // Show alert to user
                Alert.alert(
                    'Profile Image Issue',
                    'Please logout and login again to fix profile image display',
                    [{ text: 'OK' }]
                );
            }
        } else {
            console.log("❌ No user data found in store");
        }
    }, [user]);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
            setImageError(false); // Reset error state for new image
            setImageRetryCount(0); // Reset retry count for new image
        }
    };

    const uploadProfileImage = async () => {
        if (!selectedImage) return null;
        
        setUploading(true);
        try {
            const fileName = `profile-${user?.id || Date.now()}.jpg`;
            const imageUrl = await uploadImageFromUriFixed(selectedImage, fileName, 'profiles');
            return imageUrl;
        } catch (error) {
            console.error("Profile image upload error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Show specific error message
            if (errorMessage.includes('Could not connect to any backend server')) {
                Alert.alert("Connection Error", "Cannot connect to backend server. Please make sure the backend is running on localhost:3000");
            } else if (errorMessage.includes('ImageKit upload failed')) {
                Alert.alert("Upload Error", "Failed to upload to ImageKit. Please check your internet connection and try again.");
            } else {
                Alert.alert("Error", `Failed to upload image: ${errorMessage}`);
            }
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        // Test network connectivity first
        console.log('🌐 Testing network connectivity...');
        try {
            const testResponse = await fetch(`${API_URLS[0]}/`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('🌐 Basic connectivity test:', testResponse.ok ? '✅ Success' : '❌ Failed');
        } catch (error) {
            console.log('❌ Basic connectivity test failed:', error);
            Alert.alert('Network Error', 'Cannot connect to backend server. Please check your network connection and ensure the backend is running.');
            return;
        }

        const imageUrl = await uploadProfileImage();
        
        if (imageUrl) {
            try {
                // Use centralized config URLs for profile update
                const profileUrls = API_URLS.map(url => `${url}/profile/image`);
                
                const token = useUserStore.getState().token;
                let lastError: Error | null = null;
                
                for (const profileUrl of profileUrls) {
                    try {
                        console.log(`🔍 Trying profile update: ${profileUrl}`);
                        console.log('🔑 Using token:', token ? 'Token exists' : 'No token');
                        console.log('📤 Sending imageUrl:', imageUrl);
                        
                        const response = await fetch(profileUrl, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ imageUrl })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            console.log('✅ Profile updated in backend:', data);
                            
                            // Update local store
                            if (user) {
                                updateUser({ profileImage: imageUrl });
                            }
                            setSelectedImage(null);
                            Alert.alert('Success', 'Profile image updated successfully!');
                            return; // Success, exit the loop
                        } else {
                            const errorText = await response.text();
                            console.log(`❌ Server responded with ${response.status}:`, errorText);
                            throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
                        }
                    } catch (error) {
                        console.log(`❌ Failed to connect to ${profileUrl}:`, error instanceof Error ? error.message : 'Unknown error');
                        console.log('🔍 Full error details:', error);
                        lastError = error instanceof Error ? error : new Error('Unknown error');
                        continue;
                    }
                }
                
                // If we get here, all URLs failed
                throw lastError || new Error('Failed to update profile in backend');
                
            } catch (error) {
                console.error('Profile update error:', error);
                Alert.alert('Error', 'Failed to update profile. Please check your internet connection and backend server.');
            }
        } else {
            Alert.alert('Success', 'Profile updated successfully!');
        }
    };

    const handleBack = () => {
        router.replace("/");
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View className="flex-1 justify-center items-center p-4">
                    <Text className="text-lg text-gray-600 mb-4">Please login to view profile</Text>
                    <Button onPress={() => router.replace("/login" as any)}>Go to Login</Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 bg-blue-600">
                <Button onPress={handleBack}>Go to Home</Button>
                <Text className="text-xl font-bold text-white">Profile</Text>
                <View style={{ width: 80 }} />
            </View>

            <View className="p-4">
                {/* Profile Image */}
                <View className="items-center mb-6">
                    <TouchableOpacity 
                        onPress={pickImage}
                        className="relative"
                    >
                        <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-4 border-blue-500">
                            {selectedImage ? (
                                (() => {
                                    console.log('📸 Showing selected image:', selectedImage);
                                    return (
                                        <Image 
                                            source={{ uri: selectedImage }} 
                                            className="w-full h-full" 
                                            resizeMode="cover"
                                            onError={(error) => console.log('❌ Selected image error:', error.nativeEvent.error)}
                                        />
                                    );
                                })()
                            ) : user?.profileImage && user.profileImage.trim() !== '' ? (
                                (() => {
                                    // Get all possible URLs in order of preference
                                    let primaryUrl = user.profileImage || '';
                                    if (!primaryUrl || primaryUrl.trim() === '') {
                                        return null; // Skip image loading if no URL
                                    }
                                    if (user.profileImage.includes('c=at_max')) {
                                        const refreshedUrl = forceRefreshImageUrl(user.profileImage);
                                        if (refreshedUrl) {
                                            primaryUrl = refreshedUrl;
                                            console.log('🔄 Force refreshing URL due to c=at_max');
                                            updateUser({ profileImage: primaryUrl });
                                        }
                                    } else {
                                        const fixedUrl = getWorkingProfileImage(user.username, user.profileImage);
                                        if (fixedUrl) {
                                            primaryUrl = fixedUrl;
                                        }
                                    }
                                    
                                    const alternativeUrl = getAlternativeImageUrl(user.username, user.profileImage);
                                    const originalUrl = getOriginalImageUrl(user.profileImage);
                                    
                                    // Choose URL based on retry count
                                    let finalUrl = primaryUrl;
                                    if (imageRetryCount === 1 && alternativeUrl) {
                                        finalUrl = alternativeUrl;
                                        console.log('🔄 Retry 1: Using alternative URL');
                                    } else if (imageRetryCount === 2 && originalUrl) {
                                        finalUrl = originalUrl;
                                        console.log('🔄 Retry 2: Using original URL (no transformations)');
                                    } else if (imageRetryCount >= 3 && proxyUrl) {
                                        finalUrl = proxyUrl;
                                        console.log('🔄 Retry 3+: Using proxy URL');
                                    }
                                    
                                    console.log('🖼️ Original URL:', user.profileImage);
                                    console.log('🔧 Final URL:', finalUrl);
                                    console.log('🔄 Retry count:', imageRetryCount);
                                    
                                    return (
                                        <Image 
                                            key={`profile-image-${imageRetryCount}`}
                                            source={{ uri: finalUrl }} 
                                            className="w-full h-full" 
                                            resizeMode="cover"
                                            onError={async (error) => {
                                                console.log('❌ Profile image error:', error.nativeEvent.error);
                                                if (imageRetryCount < 4) {
                                                    if (imageRetryCount === 2 && !proxyUrl) {
                                                        // Try to get proxy URL before retry 3
                                                        console.log('🔄 Getting proxy URL...');
                                                        const proxied = await getProxyImageUrl(user.profileImage);
                                                        if (proxied) {
                                                            setProxyUrl(proxied);
                                                            console.log('✅ Proxy URL obtained, will retry with proxy');
                                                        }
                                                    }
                                                    setImageRetryCount(imageRetryCount + 1);
                                                    setImageError(true);
                                                    console.log(`🔄 Retrying with different URL format (attempt ${imageRetryCount + 1})`);
                                                } else {
                                                    console.log('❌ All URL formats failed, showing placeholder');
                                                }
                                            }}
                                            onLoad={() => {
                                                console.log('✅ Profile image loaded successfully');
                                                setImageError(false);
                                                setImageRetryCount(0); // Reset retry count on success
                                            }}
                                        />
                                    );
                                })()
                            ) : (
                                <View className="items-center justify-center">
                                    <Text className="text-gray-400 text-5xl">👤</Text>
                                    <Text className="text-gray-500 text-xs mt-1">Add Photo</Text>
                                </View>
                            )}
                        </View>
                        {uploading && (
                            <View className="absolute inset-0 bg-black bg-opacity-50 rounded-full justify-center items-center">
                                <Text className="text-white text-sm">Uploading...</Text>
                            </View>
                        )}
                        <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2">
                            <Text className="text-white text-sm">📷</Text>
                        </View>
                    </TouchableOpacity>
                    <Text className="text-sm text-gray-500 mt-2">Tap to change photo</Text>
                </View>

                {/* User Info Form */}
                <View className="bg-gray-50 rounded-lg p-4 mb-6">
                    <Text className="text-sm font-semibold text-gray-600 mb-1">Username</Text>
                    <TextInput
                        className="border border-gray-300 rounded-md bg-white p-3 mb-3"
                        placeholder="Enter username"
                        value={username}
                        onChangeText={(text) => setUsername(text)}
                    />

                    <Text className="text-sm font-semibold text-gray-600 mb-1">User ID</Text>
                    <TextInput
                        className="border border-gray-300 rounded-md bg-gray-100 p-3 mb-3"
                        value={user.id}
                        editable={false}
                    />

                    <Text className="text-sm font-semibold text-gray-600 mb-1">Email (Optional)</Text>
                    <TextInput
                        className="border border-gray-300 rounded-md bg-white p-3 mb-4"
                        placeholder="Enter email"
                        keyboardType="email-address"
                    />
                </View>

                {/* Action Buttons */}
                <View className="space-y-3">
                    <Button onPress={handleUpdateProfile} disabled={uploading}>
                        {uploading ? 'Updating...' : 'Update Profile'}
                    </Button>

                    <TouchableOpacity
                        onPress={() => {
                            console.log('🔄 Clearing user store cache...');
                            logout(); // This will clear the store
                            Alert.alert('Cache Cleared', 'Please login again to get fresh data');
                        }}
                        className="bg-orange-500 py-3 rounded-lg mb-2"
                    >
                        <Text className="text-white text-center font-semibold">Clear Cache & Logout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={logout}
                        className="bg-red-500 py-4 rounded-lg"
                    >
                        <Text className="text-white text-center font-semibold">Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}
