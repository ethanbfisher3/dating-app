import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@favorite_recipes";

let favoriteIndices: Set<number> = new Set();
const listeners = new Set<() => void>();
let hasInitialized = false;
let initializationPromise: Promise<void> | null = null;

function notifyListeners() {
  listeners.forEach((l) => l());
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoriteIndices]));
  } catch {}
}

export async function initializeFavoriteRecipes(): Promise<void> {
  if (hasInitialized) return;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            favoriteIndices = new Set(parsed);
          }
        }
      } catch {
      } finally {
        hasInitialized = true;
        notifyListeners();
      }
    })();
  }

  await initializationPromise;
}

export function getFavoriteRecipes(): Set<number> {
  return new Set(favoriteIndices);
}

export function isRecipeFavorited(index: number): boolean {
  return favoriteIndices.has(index);
}

export function toggleFavoriteRecipe(index: number): void {
  if (favoriteIndices.has(index)) {
    favoriteIndices.delete(index);
  } else {
    favoriteIndices.add(index);
  }
  notifyListeners();
  void persist();
}

export function subscribeFavoriteRecipes(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
