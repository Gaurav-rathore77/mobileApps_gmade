import { View, Text, Image, Button, ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Product } from "../../../../api/productService";
import { useProducts } from "../../../../hooks/useProducts";
import { ErrorBoundary, LoadingSpinner } from "../../../../components/ErrorBoundary";
import productService from "../../../../api/productService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProductDetailPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { products } = useProducts();

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setError('Product ID is missing');
                setLoading(false);
                return;
            }

            console.log("Fetching product with ID:", id);

            setLoading(true);
            setError(null);

            try {
                // First try to find in local products
                const foundProduct = products?.find(p => p._id === id);
                if (foundProduct) {
                    setProduct(foundProduct);
                    setLoading(false);
                    return;
                }

                // If not found locally, fetch from API
                const fetchedProduct = await productService.getProduct(id);
                setProduct(fetchedProduct);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError('Product not found');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, products]);

    const handleBack = () => router.push("/product/index" as any);

    const handleEdit = () => {
        // Navigate to edit page (you can implement this later)
        Alert.alert('Edit', 'Edit functionality coming soon!');
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // Implement delete functionality
                        Alert.alert('Success', 'Product deleted successfully!');
                        router.push("/product/index" as any);
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center" style={{ paddingTop: insets.top }}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (error || !product) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center p-4" style={{ paddingTop: insets.top }}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <Text className="text-red-500 text-lg font-semibold mb-4">
                    {error || 'Product not found'}
                </Text>
                <Button onPress={handleBack} title="Go Back to Products" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView>
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Button onPress={handleBack} title="← Back" />
                <Text className="text-lg font-bold text-gray-800">Product Details</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Product Image */}
            {product.image && (
                <View className="w-full h-64 bg-gray-100">
                    <Image 
                        source={{ uri: product.image }} 
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
            )}

            {/* Product Info */}
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800 mb-2">{product.name}</Text>
                <Text className="text-2xl font-bold text-green-600 mb-4">₹{product.price}</Text>
                
                {product.description && (
                    <View className="mb-6">
                        <Text className="text-lg font-semibold text-gray-700 mb-2">Description</Text>
                        <Text className="text-gray-600 leading-relaxed">{product.description}</Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View className="space-y-3">
                    <Button 
                        onPress={handleEdit}
                        title="Edit Product"
                        color="#007AFF"
                    />
                    <Button 
                        onPress={handleDelete}
                        title="Delete Product"
                        color="#FF3B30"
                    />
                </View>

                {/* Additional Info */}
                <View className="mt-6 pt-6 border-t border-gray-200">
                    <Text className="text-sm text-gray-500">
                        Product ID: {product._id}
                    </Text>
                </View>
            </View>
        </ScrollView>
        </SafeAreaView>
    );
}
