import type { Activity } from "./activities"

export type IdeaTemplate = {
  template: string
  slots: string[]
}

export const SHORT_TEMPLATES: IdeaTemplate[] = [
  { template: "Grab a bite at {meal}", slots: ["meal"] },
  { template: "Take a walk at {park}", slots: ["park"] },
  { template: "{activity}", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  {
    template: "{activity} and then cook {recipe}",
    slots: ["activity", "recipe"],
  },
]

export const STANDARD_TEMPLATES: IdeaTemplate[] = [
  {
    template: "Start at {meal}, then walk at {park}",
    slots: ["meal", "park"],
  },
  {
    template: "{activity}, then grab dessert at {dessert}",
    slots: ["activity", "dessert"],
  },
  {
    template: "Cook {recipe} together, then go to {dessert}",
    slots: ["recipe", "dessert"],
  },
  {
    template: "Visit {learningSpot}, then stop at {meal}",
    slots: ["learningSpot", "meal"],
  },
  {
    template: "Browse {shop} and then {activity}",
    slots: ["shop", "activity"],
  },
  {
    template: "{activity} and then {activity}",
    slots: ["activity", "activity"],
  },
]

export const LONG_TEMPLATES: IdeaTemplate[] = [
  {
    template:
      "Start at {park}, eat at {meal}, {activity}, and finish with {dessert}",
    slots: ["park", "meal", "activity", "dessert"],
  },
  {
    template:
      "Visit {learningSpot}, explore {shop}, then have {meal} for dinner",
    slots: ["learningSpot", "shop", "meal"],
  },
  {
    template: "Cook {recipe}, then go to {park}, and finish with {dessert}",
    slots: ["recipe", "park", "dessert"],
  },
  {
    template: "First, {activity}. Then, {activity}. Finally, {activity}.",
    slots: ["activity", "activity", "activity"],
  },
]

function createRepeatedSlots(slot: string, count: number): string[] {
  return Array.from({ length: count }, () => slot)
}

function joinActivityPlaceholders(count: number): string {
  const placeholders = Array.from({ length: count }, () => "{activity}")

  if (placeholders.length <= 1) {
    return placeholders[0] || "{activity}"
  }

  if (placeholders.length === 2) {
    return `${placeholders[0]} and ${placeholders[1]}`
  }

  return `${placeholders.slice(0, -1).join(", ")}, and ${placeholders.at(-1)}`
}

function getMinimumActivityCount(
  durationMinutes: number,
  activities: Activity[],
): number {
  const hourlyCount = Math.max(1, Math.ceil(durationMinutes / 60))
  const sortedMaxDurations = [...activities]
    .map((activity) => activity.durationMinutes?.max ?? 60)
    .filter((duration) => duration > 0)
    .sort((left, right) => right - left)

  if (!sortedMaxDurations.length) {
    return hourlyCount
  }

  let coveredMinutes = 0
  let activityCount = 0

  while (coveredMinutes < durationMinutes) {
    const durationCap =
      sortedMaxDurations[activityCount] || sortedMaxDurations[0] || 60
    coveredMinutes += durationCap
    activityCount += 1
  }

  return Math.max(hourlyCount, activityCount)
}

export function getFreeStayInTemplates(
  durationMinutes: number,
  activities: Activity[],
  maxPrice: number,
  maxDistance: number,
): IdeaTemplate[] {
  if (maxPrice > 0 || maxDistance > 0 || durationMinutes <= 60) {
    return []
  }

  const baseCount = Math.max(
    2,
    getMinimumActivityCount(durationMinutes, activities),
  )
  const slotCounts = Array.from(
    new Set([baseCount, baseCount + 1].filter((count) => count <= 6)),
  )

  return slotCounts.map((count) => ({
    template: joinActivityPlaceholders(count),
    slots: createRepeatedSlots("activity", count),
  }))
}
