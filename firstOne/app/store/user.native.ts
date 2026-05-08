import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginApi, registerApi } from "../../api/auth";

interface UserData {
  username?: string;
  email?: string;
  password?: string;
  profileImage?: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
  profileImage?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  fingerprintLogin: () => Promise<void>;
  registerWithFingerprint: (userData: UserData) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Custom storage adapter that prevents saving null user data
const customStorage = {
  getItem: async (name: string) => {
    const data = await AsyncStorage.getItem(name);
    console.log("📖 Reading from storage:", name, data ? "Found" : "Not found");
    return data ? JSON.parse(data) : null;
  },
  setItem: async (name: string, value: any) => {
    console.log("💾 Attempting to save to storage:", name);
    console.log("📊 Value being saved:", JSON.stringify(value));
    
    // Don't save if user is null (logout state)
    if (value.state && value.state.user === null && value.state.token === null) {
      console.log("⚠️ PREVENTING SAVE OF NULL USER DATA (LOGOUT STATE)");
      return;
    }
    
    console.log("✅ Saving data to storage");
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name: string) => {
    console.log("🗑️ Removing from storage:", name);
    await AsyncStorage.removeItem(name);
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log("📱 Mobile login attempt:", username);
          const data = await loginApi({ username, password });
          console.log("✅ Mobile login success:", data);
          
          // Force fix profile image URL if it has typo
          if (data.user.profileImage && data.user.profileImage.includes('profiless')) {
            console.log("🔧 Fixing profile image URL in login...");
            data.user.profileImage = data.user.profileImage.replace('profiless', 'profiles');
            console.log("✅ Fixed URL:", data.user.profileImage);
          }
          
          set({ token: data.token, user: data.user, isLoading: false });
          return true;
        } catch (error) {
          console.error("❌ Mobile login error:", error);
          set({ 
            error: error instanceof Error ? error.message : "Login failed", 
            isLoading: false 
          });
          return false;
        }
      },

      logout: () => {
        console.log("📱 Mobile logout");
        // Backup user data before clearing session
        const currentState = get();
        if (currentState.user && currentState.token) {
          AsyncStorage.setItem('user-backup', JSON.stringify({
            user: currentState.user,
            token: currentState.token
          })).then(() => {
            console.log("💾 User data backed up before logout");
          });
        }
        
        // Clear current session
        set({ user: null, token: null, error: null });
      },

      fingerprintLogin: async () => {
        console.log("👆 Fingerprint login");
        set({ isLoading: true, error: null });
        
        // Check if we have a registered user in persistent storage
        const state = get();
        if (state.user && state.token && !state.token.includes('fingerprint_token_')) {
          // User is already logged in with real credentials
          console.log("✅ User already logged in:", state.user.username);
          set({ isLoading: false });
          return;
        }
        
        // Check backup storage first (most reliable)
        try {
          const backupData = await AsyncStorage.getItem('user-backup');
          if (backupData) {
            const parsed = JSON.parse(backupData);
            if (parsed.user && parsed.token && !parsed.token.includes('fingerprint_token_')) {
              console.log("✅ Found user data in backup:", parsed.user.username);
              set({
                user: parsed.user,
                token: parsed.token,
                isLoading: false,
                error: null
              });
              return;
            }
          }
        } catch (e) {
          console.log("❌ Failed to read backup storage:", e);
        }
        
        // Wait for persist middleware to hydrate from storage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if storage hydrated the user data
        const hydratedState = get();
        if (hydratedState.user && hydratedState.token && !hydratedState.token.includes('fingerprint_token_')) {
          console.log("✅ Hydrated user from storage:", hydratedState.user.username);
          set({ isLoading: false });
          return;
        }
        
        // Fallback to mock user if no real registered user found
        console.log("⚠️ No real registered user found, using fallback");
        const mockUser = {
          id: "fingerprint_user",
          username: "Fingerprint User",
          email: "user@fingerprint.com",
          profileImage: undefined
        };
        
        const mockToken = "fingerprint_token_" + Date.now();
        
        set({
          user: mockUser,
          token: mockToken,
          isLoading: false,
          error: null
        });
      },

      registerWithFingerprint: async (userData: UserData): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          console.log("👆 Fingerprint registration:", userData);
          // Ensure required fields are present
          if (!userData.username || !userData.password) {
            throw new Error("Username and password are required for fingerprint registration");
          }
          const response = await registerApi({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            profileImage: userData.profileImage
          });
          console.log("✅ Fingerprint registration success:", response);
          
          // Save user data and token after successful registration
          set({ 
            token: response.token, 
            user: response.user, 
            isLoading: false 
          });
          
          console.log("✅ User data saved to store:", response.user.username);
          console.log("💾 Custom storage will persist this data automatically");
          
          return true;
        } catch (error) {
          console.error("❌ Fingerprint registration error:", error);
          set({ 
            error: error instanceof Error ? error.message : "Registration failed", 
            isLoading: false 
          });
          return false;
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => customStorage as any),
    }
  )
);
