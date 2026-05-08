import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../api/productService';

interface ProductStore {
    // State
    products: Product[];
    loading: boolean;
    error: string | null;
    lastFetch: number | null;
    
    // Actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    removeProduct: (id: string) => void;
    clearError: () => void;
    reset: () => void;
    
    // Computed
    getProductById: (id: string) => Product | undefined;
    isDataStale: (maxAge?: number) => boolean;
}

export const useProductStore = create<ProductStore>()(
    (set, get) => ({
            // Initial state
            products: [],
            loading: false,
            error: null,
            lastFetch: null,
            
            // Actions
            setLoading: (loading) => set({ loading }),
            
            setError: (error) => set({ error }),
            
            setProducts: (products) => set({ 
                products, 
                lastFetch: Date.now(),
                error: null 
            }),
            
            addProduct: (product) => set((state) => ({
                products: [...state.products, product],
                error: null
            })),
            
            updateProduct: (id, updates) => set((state) => ({
                products: state.products.map(p => 
                    p._id === id ? { ...p, ...updates } : p
                ),
                error: null
            })),
            
            removeProduct: (id) => set((state) => ({
                products: state.products.filter(p => p._id !== id),
                error: null
            })),
            
            clearError: () => set({ error: null }),
            
            reset: () => set({
                products: [],
                loading: false,
                error: null,
                lastFetch: null
            }),
            
            // Computed
            getProductById: (id) => {
                const { products } = get();
                return products.find(p => p._id === id);
            },
            
            isDataStale: (maxAge = 5 * 60 * 1000) => { // 5 minutes default
                const { lastFetch } = get();
                if (!lastFetch) return true;
                return Date.now() - lastFetch > maxAge;
            }
        })
);
