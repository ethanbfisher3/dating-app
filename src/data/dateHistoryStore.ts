import AsyncStorage from "@react-native-async-storage/async-storage";

export type RecordedDate = {
  id: string;
  dateOfDate: string; // ISO date string
  imageUri?: string | null;
  whoWentWith: string;
  whatYouDid: string;
  moneySpent: number;
  rating: number | null;
  whatYouLiked: string;
  whatYouLearned: string;
  recordedAt: string; // ISO timestamp
};

export const FREE_TIER_RECORDED_DATES_LIMIT = 5;
const RECORDED_DATES_KEY = "@date_history_records";

let recordedDates: RecordedDate[] = [];
const listeners = new Set<() => void>();
let hasInitialized = false;
let initializationPromise: Promise<void> | null = null;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

async function persistRecordedDates(nextDates: RecordedDate[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECORDED_DATES_KEY, JSON.stringify(nextDates));
  } catch {
    // Keep in-memory data when native storage is unavailable.
  }
}

export async function initializeRecordedDates(): Promise<void> {
  if (hasInitialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECORDED_DATES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            recordedDates = parsed;
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

export function getRecordedDates(): RecordedDate[] {
  return [...recordedDates];
}

export function addRecordedDate(date: Omit<RecordedDate, "id" | "recordedAt">): RecordedDate {
  const recordedDate: RecordedDate = {
    ...date,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    recordedAt: new Date().toISOString(),
  };

  recordedDates = [recordedDate, ...recordedDates];
  void persistRecordedDates(recordedDates);
  notifyListeners();
  return recordedDate;
}

export function removeRecordedDate(id: string): void {
  const nextRecordedDates = recordedDates.filter((date) => date.id !== id);
  if (nextRecordedDates.length === recordedDates.length) {
    return;
  }

  recordedDates = nextRecordedDates;
  void persistRecordedDates(recordedDates);
  notifyListeners();
}

export function updateRecordedDate(id: string, updates: Omit<RecordedDate, "id" | "recordedAt">): void {
  const recordIndex = recordedDates.findIndex((date) => date.id === id);
  if (recordIndex === -1) {
    return;
  }

  const updatedDate: RecordedDate = {
    ...recordedDates[recordIndex],
    ...updates,
  };

  recordedDates = [...recordedDates.slice(0, recordIndex), updatedDate, ...recordedDates.slice(recordIndex + 1)];

  void persistRecordedDates(recordedDates);
  notifyListeners();
}

export function subscribeRecordedDates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
