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

let recordedDates: RecordedDate[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getRecordedDates(): RecordedDate[] {
  return [...recordedDates];
}

export function addRecordedDate(
  date: Omit<RecordedDate, "id" | "recordedAt">,
): RecordedDate {
  const recordedDate: RecordedDate = {
    ...date,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    recordedAt: new Date().toISOString(),
  };

  recordedDates = [recordedDate, ...recordedDates];
  notifyListeners();
  return recordedDate;
}

export function removeRecordedDate(id: string): void {
  const nextRecordedDates = recordedDates.filter((date) => date.id !== id);
  if (nextRecordedDates.length === recordedDates.length) {
    return;
  }

  recordedDates = nextRecordedDates;
  notifyListeners();
}

export function updateRecordedDate(
  id: string,
  updates: Omit<RecordedDate, "id" | "recordedAt">,
): void {
  const recordIndex = recordedDates.findIndex((date) => date.id === id);
  if (recordIndex === -1) {
    return;
  }

  const updatedDate: RecordedDate = {
    ...recordedDates[recordIndex],
    ...updates,
  };

  recordedDates = [
    ...recordedDates.slice(0, recordIndex),
    updatedDate,
    ...recordedDates.slice(recordIndex + 1),
  ];

  notifyListeners();
}

export function subscribeRecordedDates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
