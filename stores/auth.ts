import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Api } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "client" | "affiliate" | "admin";
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
  createdAt?: string;
  emailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<any>;
  googleLogin: (idToken: string) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => void;
  loadPersistedData: () => Promise<void>;
  clearError: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<User>;
}

type AuthStore = AuthState & AuthActions;

const STORAGE_KEYS = {
  USER: "@amazon_group:user",
  TOKEN: "@amazon_group:token",
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  loading: false,
  error: null,
  isInitialized: false,

  // Actions
  login: async (email: string, password: string) => {
  set({ loading: true, error: null });
  try {
    // Normalizar el email antes de enviarlo
    const normalizedEmail = email.trim().toLowerCase();
    const data = await Api.login(normalizedEmail, password);

    // Persist data
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

    set({ user: data.user, token: data.token, loading: false });

    Toast.show({
      type: "success",
      text1: "Inicio de sesión exitoso",
      text2: "Bienvenido de vuelta",
    });

    return data;
  } catch (err: any) {
    const errorMessage = err.message || "Error al iniciar sesión";
    set({ error: errorMessage, loading: false });

    Toast.show({
      type: "error",
      text1: "Error de autenticación",
      text2: errorMessage,
    });

    throw err;
  }
},

  googleLogin: async (idToken: string) => {
    set({ loading: true, error: null });
    try {
      const data = await Api.googleLogin(idToken);

      // Persist data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);

      set({ user: data.user, token: data.token, loading: false });

      Toast.show({
        type: "success",
        text1: "Inicio de sesión con Google exitoso",
        text2: "Bienvenido",
      });

      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Error al iniciar con Google";
      set({ error: errorMessage, loading: false });

      Toast.show({
        type: "error",
        text1: "Error de autenticación",
        text2: errorMessage,
      });

      throw err;
    }
  },

  register: async (payload: any) => {
  set({ loading: true, error: null });
  try {
    // Normalizar el email si existe en el payload
    const normalizedPayload = {
      ...payload,
      email: payload.email?.trim().toLowerCase(),
    };
    
    const data = await Api.register(normalizedPayload);
    set({ loading: false });

    Toast.show({
      type: "success",
      text1: "Registro exitoso",
      text2: "Tu cuenta ha sido creada",
    });

    return data;
  } catch (err: any) {
    const errorMessage = err.message || "Error en el registro";
    set({ error: errorMessage, loading: false });

    Toast.show({
      type: "error",
      text1: "Error de registro",
      text2: errorMessage,
    });

    throw err;
  }
},

  logout: async () => {
    try {
      // Clear persisted data
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);

      set({ user: null, token: null });

      Toast.show({
        type: "info",
        text1: "Sesión cerrada",
        text2: "Has salido de tu cuenta",
      });
    } catch (err) {
      console.error("Error during logout:", err);
    }
  },

  loadPersistedData: async () => {
    try {
      set({ loading: true });

      const [userJson, token] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      ]);

      if (userJson && token) {
        try {
          const user = JSON.parse(userJson);
          set({ user, token, isInitialized: true, loading: false });
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          // Clear corrupted data
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.USER,
            STORAGE_KEYS.TOKEN,
          ]);
          set({ user: null, token: null, isInitialized: true, loading: false });
        }
      } else {
        set({ user: null, token: null, isInitialized: true, loading: false });
      }
    } catch (err) {
      console.error("Error loading persisted auth data:", err);
      set({ user: null, token: null, isInitialized: true, loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  updateUserProfile: async (updates: Partial<User>) => {
    const { user, token } = get();
    if (!user || !token) {
      throw new Error("User not authenticated");
    }

    set({ loading: true, error: null });

    try {
      // Persistir cambios en el backend
      const serverUser = await Api.updateMe(token, updates);
      const updatedUser = { ...user, ...serverUser };

      // Save to storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(updatedUser),
      );

      set({ user: updatedUser, loading: false });

      Toast.show({
        type: "success",
        text1: "Perfil actualizado",
        text2: "Tu información ha sido guardada correctamente",
      });

      return updatedUser;
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar perfil";

      set({ error: errorMessage, loading: false });

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });

      throw err;
    }
  },
}));

export default useAuthStore;
