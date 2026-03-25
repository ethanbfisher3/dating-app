export type PlannedDate = {
  id: string
  date: string // ISO date string YYYY-MM-DD
  createdAt: string
}

let plannedDates: PlannedDate[] = []
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function getPlannedDates(): PlannedDate[] {
  return [...plannedDates]
}

export function addPlannedDate(date: string): PlannedDate {
  const plannedDate: PlannedDate = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    date,
    createdAt: new Date().toISOString(),
  }

  plannedDates = [plannedDate, ...plannedDates]
  notifyListeners()
  return plannedDate
}

export function removePlannedDate(id: string): void {
  const next = plannedDates.filter((entry) => entry.id !== id)
  if (next.length === plannedDates.length) {
    return
  }

  plannedDates = next
  notifyListeners()
}

export function subscribePlannedDates(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
