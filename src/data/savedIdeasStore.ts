import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FilledIdea } from "../hooks/useFilledIdeas";

export type SavedDateIdea = FilledIdea & {
  id: string;
  savedAt: string;
  selectedDate?: string;
};

export const FREE_TIER_SAVED_IDEAS_LIMIT = 3;
const SAVED_IDEAS_KEY = "@saved_date_ideas";

let savedIdeas: SavedDateIdea[] = [];
const listeners = new Set<() => void>();
let hasInitialized = false;
let initializationPromise: Promise<void> | null = null;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

async function persistSavedIdeas(nextSavedIdeas: SavedDateIdea[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_IDEAS_KEY, JSON.stringify(nextSavedIdeas));
  } catch {
    // Keep in-memory data when native storage is unavailable.
  }
}

export async function initializeSavedIdeas(): Promise<void> {
  if (hasInitialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(SAVED_IDEAS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            savedIdeas = parsed;
          }
        }
      } catch {
        // Keep empty in-memory defaults when storage is unavailable or corrupted.
      } finally {
        hasInitialized = true;
        notifyListeners();
      }
    })();
  }

  await initializationPromise;
}

export function getSavedIdeas(): SavedDateIdea[] {
  return [...savedIdeas];
}

export function canSaveIdea(isUnlocked: boolean): boolean {
  if (isUnlocked) return true;
  return savedIdeas.length < FREE_TIER_SAVED_IDEAS_LIMIT;
}

export function saveDateIdea(idea: FilledIdea, selectedDate?: string): SavedDateIdea {
  const signature = `${idea.filledTemplate}__${idea.template}`;
  const existing = savedIdeas.find((saved) => `${saved.filledTemplate}__${saved.template}` === signature);

  if (existing) {
    return existing;
  }

  const savedIdea: SavedDateIdea = {
    ...idea,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    savedAt: new Date().toISOString(),
    selectedDate,
  };

  savedIdeas = [savedIdea, ...savedIdeas];
  void persistSavedIdeas(savedIdeas);
  notifyListeners();
  return savedIdea;
}

export function removeSavedIdea(id: string): void {
  const nextSavedIdeas = savedIdeas.filter((idea) => idea.id !== id);
  if (nextSavedIdeas.length === savedIdeas.length) {
    return;
  }

  savedIdeas = nextSavedIdeas;
  void persistSavedIdeas(savedIdeas);
  notifyListeners();
}

export function subscribeSavedIdeas(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
