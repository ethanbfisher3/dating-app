import type { Activity } from "./activities";
import { LONG_DATE_TEMPLATES, SHORT_DATE_TEMPLATES, STANDARD_DATE_TEMPLATES, templateMatchesSelectedCategories, type TemplateLike } from "./dateTemplatesCatalog";
import { DATE_CATEGORIES } from "src/utils/utils";
import type { PlannedDateResultsParams } from "../types/navigation";

export type IdeaTemplate = TemplateLike;

export const SHORT_TEMPLATES: IdeaTemplate[] = SHORT_DATE_TEMPLATES;

export const STANDARD_TEMPLATES: IdeaTemplate[] = STANDARD_DATE_TEMPLATES;

export const LONG_TEMPLATES: IdeaTemplate[] = LONG_DATE_TEMPLATES;

function createRepeatedSlots(slot: string, count: number): string[] {
  return Array.from({ length: count }, () => slot);
}

function joinActivityPlaceholders(count: number): string {
  const placeholders = Array.from({ length: count }, () => "{activity}");

  if (placeholders.length <= 1) {
    return placeholders[0] || "{activity}";
  }

  if (placeholders.length === 2) {
    return `${placeholders[0]} and ${placeholders[1]}`;
  }

  return `${placeholders.slice(0, -1).join(", ")}, and ${placeholders.at(-1)}`;
}

function getMinimumActivityCount(durationMinutes: number, activities: Activity[]): number {
  const hourlyCount = Math.max(1, Math.ceil(durationMinutes / 60));
  const sortedMaxDurations = [...activities]
    .map((activity) => activity.durationMinutes?.max ?? 60)
    .filter((duration) => duration > 0)
    .sort((left, right) => right - left);

  if (!sortedMaxDurations.length) {
    return hourlyCount;
  }

  let coveredMinutes = 0;
  let activityCount = 0;

  while (coveredMinutes < durationMinutes) {
    const durationCap = sortedMaxDurations[activityCount] || sortedMaxDurations[0] || 60;
    coveredMinutes += durationCap;
    activityCount += 1;
  }

  return Math.max(hourlyCount, activityCount);
}

export function getRequiredPlaceSlots(params: PlannedDateResultsParams): string[] {
  const windowDuration = (() => {
    const start = params.startHour * 60;
    let end = params.endHour * 60;
    if (end <= start) end += 24 * 60;
    return end - start;
  })();
  const requested = typeof params.dateLengthMinutes === "number" && params.dateLengthMinutes > 0 ? params.dateLengthMinutes : windowDuration;
  const duration = Math.min(windowDuration, requested);
  const selectedCategories = params.categories || [];

  let base: IdeaTemplate[];
  if (duration <= 90) base = SHORT_TEMPLATES;
  else if (duration <= 180) base = STANDARD_TEMPLATES;
  else base = LONG_TEMPLATES;

  const slots = new Set<string>();
  for (const template of base) {
    if (!templateMatchesSelectedCategories(template, selectedCategories)) continue;
    for (const slot of template.slots) {
      if (slot !== "activity" && slot !== "recipe") slots.add(slot);
    }
  }
  return [...slots];
}

export function getFreeStayInTemplates(
  durationMinutes: number,
  activities: Activity[],
  maxPrice: number,
  maxDistance: number,
): IdeaTemplate[] {
  if (maxPrice > 0 || maxDistance > 0 || durationMinutes <= 60) {
    return [];
  }

  const baseCount = Math.max(2, getMinimumActivityCount(durationMinutes, activities));
  const slotCounts = Array.from(new Set([baseCount, baseCount + 1].filter((count) => count <= 6)));

  return slotCounts.map((count) => ({
    template: joinActivityPlaceholders(count),
    slots: createRepeatedSlots("activity", count),
    categories: [...DATE_CATEGORIES],
  }));
}
