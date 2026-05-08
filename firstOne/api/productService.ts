import { API_URLS } from "../app/config/mobile";

export interface Product {
    _id: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
}

class productService {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }
    private async apiCall(endpoint: string, options: RequestInit = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers,
        };

        // Try different URLs in order
        for (const baseUrl of API_URLS) {
            const url = `${baseUrl}/product${endpoint}`;
            try {
                console.log(`🔍 Trying product API at: ${url}`);
                const response = await fetch(url, { ...options, headers });
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
                }

                return await response.json();
            } catch (error) {
                console.error(`API call failed for ${endpoint}:`, error);
                continue; // Try next URL
            }
        }
        
        // If all URLs failed
        throw new Error(`All API endpoints failed for ${endpoint}`);
    }

    async getAllProducts(): Promise<Product[]> {
        return await this.apiCall('/all');
    }

    async createProduct(productData: Omit<Product, '_id'>): Promise<Product> {
        return await this.apiCall('/create', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    }

    async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
        return await this.apiCall(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    }

    async deleteProduct(id: string): Promise<void> {
        return await this.apiCall(`/${id}`, {
            method: 'DELETE',
        });
    }

    async getProduct(id: string): Promise<Product> {
        return await this.apiCall(`/${id}`);
    }
}

const productServiceInstance = new productService();
export default productServiceInstance;

























// class ProductService {
//     private token: string | null = null;

//     setToken(token: string | null) {
//         this.token = token;
//     }

//     // Centralized API call method
//     private async apiCall(endpoint: string, options: RequestInit = {}) {
//         const url = `${getApiUrl('/product')}${endpoint}`;
//         const headers = {
//             'Content-Type': 'application/json',
//             ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
//             ...options.headers,
//         };
   
//         try {
//             const response = await fetch(url, { ...options, headers });
            
//             if (!response.ok) {
//                 throw new Error(`API Error: ${response.status} - ${response.statusText}`);
//             }

//             return await response.json();
//         } catch (error) {
//             console.error(`API call failed for ${endpoint}:`, error);
//             throw error;
//         }
//     }

//     // Get all products
//     async getAllProducts(): Promise<Product[]> {
//         return await this.apiCall('/all');
//     }

//     // Create new product
//     async createProduct(productData: Omit<Product, '_id'>): Promise<Product> {
//         return await this.apiCall('/create', {
//             method: 'POST',
//             body: JSON.stringify(productData),
//         });
//     }

//     // Update product
//     async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
//         return await this.apiCall(`/${id}`, {
//             method: 'PUT',
//             body: JSON.stringify(productData),
//         });
//     }

//     // Delete product
//     async deleteProduct(id: string): Promise<void> {
//         return await this.apiCall(`/${id}`, {
//             method: 'DELETE',
//         });
//     }

//     // Get single product
//     async getProduct(id: string): Promise<Product> {
//         return await this.apiCall(`/${id}`);
//     }
// }

// Singleton instance
// export const productService = new ProductService();
