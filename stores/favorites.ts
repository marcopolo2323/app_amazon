import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FavoriteItem = {
  id: string | number;
  title: string;
  price?: number;
  image?: string;
  category?: string;
};

type FavoritesState = {
  favorites: FavoriteItem[];
  isInitialized: boolean;
  userScope?: string; // userId actual para scoping
  setUserScope: (userId?: string) => void;
  loadPersistedFavorites: () => Promise<void>;
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string | number) => void;
  clearFavorites: () => void;
};

const baseKey = "@amazon_group:favorites";
function keyFor(userId?: string) {
  return `${baseKey}:${userId || 'guest'}`;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isInitialized: false,
  userScope: undefined,
  setUserScope: (userId) => {
    const current = get().userScope;
    if (current !== userId) {
      set({ userScope: userId, isInitialized: false, favorites: [] });
    }
  },
  loadPersistedFavorites: async () => {
    try {
      const raw = await AsyncStorage.getItem(keyFor(get().userScope));
      if (raw) {
        const parsed = JSON.parse(raw) as FavoriteItem[];
        set({ favorites: parsed, isInitialized: true });
      } else {
        set({ favorites: [], isInitialized: true });
      }
    } catch (e) {
      set({ isInitialized: true });
    }
  },
  isFavorite: (id) => {
    return get().favorites.some((f) => String(f.id) === String(id));
  },
  toggleFavorite: (item) => {
    const current = get().favorites;
    const exists = current.some((f) => String(f.id) === String(item.id));
    let next: FavoriteItem[];
    if (exists) {
      next = current.filter((f) => String(f.id) !== String(item.id));
    } else {
      next = [{ ...item }, ...current];
    }
    set({ favorites: next });
    AsyncStorage.setItem(keyFor(get().userScope), JSON.stringify(next)).catch(() => {});
  },
  removeFavorite: (id) => {
    const next = get().favorites.filter((f) => String(f.id) !== String(id));
    set({ favorites: next });
    AsyncStorage.setItem(keyFor(get().userScope), JSON.stringify(next)).catch(() => {});
  },
  clearFavorites: () => {
    set({ favorites: [] });
    AsyncStorage.removeItem(keyFor(get().userScope)).catch(() => {});
  },
}));