import { useEffect, useCallback } from 'react';
import productService, { Product } from '../api/productService';
import { useUserStore } from '../app/store/user.native';
import { useProductStore } from '../store/productStore';

export const useProducts = (autoFetch = true) => {
    const token = useUserStore((state: any) => state.token);
    const {
        products,
        loading,
        error,
        lastFetch,
        setLoading,
        setError,
        setProducts,
        addProduct,
        updateProduct: updateStoreProduct,
        removeProduct,
        clearError,
        isDataStale
    } = useProductStore();

    // Initialize service with token
    useEffect(() => {
        productService.setToken(token);
    }, [token]);

    // Fetch all products with proper error handling
    const fetchProducts = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && !isDataStale() && products.length > 0) {
            return; // Use cached data if not stale
        }

        setLoading(true);
        clearError();
        
        try {
            const data = await productService.getAllProducts();
            setProducts(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isDataStale, products.length, setLoading, clearError, setProducts, setError]);

    // Create new product with optimistic updates
    const createProduct = useCallback(async (productData: Omit<Product, '_id'>) => {
        setLoading(true);
        clearError();
        
        try {
            const newProduct = await productService.createProduct(productData);
            addProduct(newProduct);
            return newProduct;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, clearError, addProduct, setError]);

    // Update product with optimistic updates
    const updateProduct = useCallback(async (id: string, productData: Partial<Product>) => {
        setLoading(true);
        clearError();
        
        try {
            const updatedProduct = await productService.updateProduct(id, productData);
            updateStoreProduct(id, productData);
            return updatedProduct;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, clearError, updateStoreProduct, setError]);

    // Delete product with optimistic updates
    const deleteProduct = useCallback(async (id: string) => {
        setLoading(true);
        clearError();
        
        try {
            await productService.deleteProduct(id);
            removeProduct(id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, clearError, removeProduct, setError]);

    // Get single product
    const getProduct = useCallback(async (id: string) => {
        setLoading(true);
        clearError();
        
        try {
            const product = await productService.getProduct(id);
            return product;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [setLoading, clearError, setError]);

    // Retry failed operation
    const retry = useCallback(() => {
        clearError();
        fetchProducts(true);
    }, [clearError, fetchProducts]);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchProducts();
        }
    }, [autoFetch, fetchProducts]);

    return {
        // State
        products,
        loading,
        error,
        lastFetch,
        
        // Actions
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        retry,
        
        // Utilities
        clearError,
        isDataStale: () => isDataStale(),
    };
};
