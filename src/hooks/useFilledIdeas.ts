import { useMemo } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import allRecipes, { Recipe } from "../data/Recipes";
import type { Activity } from "../data/activities";
import { getFreeStayInTemplates, IdeaTemplate, LONG_TEMPLATES, SHORT_TEMPLATES, STANDARD_TEMPLATES } from "../data/datePlannerTemplates";
import { templateMatchesSelectedCategories } from "../data/dateTemplatesCatalog";
import type { PlaceSummary } from "./usePlacesActivitiesRecipes";
import { SLOT_TO_PLACE_TYPES, SLOT_TO_CATEGORY } from "src/utils/utils";
import { usePremium } from "./usePremium";

export type FilledIdea = {
  template: string;
  filledTemplate: string;
  recipeIndex?: number;
  commuteToFirstMinutes?: number | null;
  commuteFromLastMinutes?: number | null;
  places: Record<string, PlaceSummary | null>;
  schedule?: Array<{
    title: string;
    slot: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    place: PlaceSummary | null;
    travelToNextMinutes: number | null;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
  }>;
};

type SlotCandidate = {
  id?: string;
  value: string;
  place: PlaceSummary | null;
  recipeIndex?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
};

type UseFilledIdeasArgs = {
  params: PlannedDateResultsParams;
  places: PlaceSummary[];
  recipes: Recipe[];
  activities: Activity[];
};

function computeWindowDurationMinutes(startHour: number, endHour: number) {
  const start = startHour * 60;
  let end = endHour * 60;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function getEffectiveDateDurationMinutes(params: PlannedDateResultsParams): number {
  const windowDuration = computeWindowDurationMinutes(params.startHour, params.endHour);
  const requestedDuration =
    typeof params.dateLengthMinutes === "number" && params.dateLengthMinutes > 0 ? params.dateLengthMinutes : windowDuration;

  return Math.min(windowDuration, requestedDuration);
}

function getRandomQuarterHourOffset(maxOffsetMinutes: number): number {
  if (maxOffsetMinutes < 15) {
    return 0;
  }

  const maxQuarterSteps = Math.floor(maxOffsetMinutes / 15);
  const chosenStep = Math.floor(Math.random() * (maxQuarterSteps + 1));
  return chosenStep * 15;
}

function formatTimeLabel(totalMinutes: number): string {
  const minutesInDay = 24 * 60;
  const normalizedMinutes = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hour24 = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minuteText = String(minute).padStart(2, "0");
  return `${hour12}:${minuteText} ${suffix}`;
}

function requiresPlaces(template: IdeaTemplate | undefined | null): boolean {
  if (!template || !Array.isArray(template.slots)) {
    return false;
  }

  return template.slots.some((slot) => getAllowedTypesForSlot(slot).length > 0);
}

function getAllowedTypesForSlot(slot: string): string[] {
  const slotOptions = slot
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowedTypes = new Set<string>();

  for (const option of slotOptions) {
    const optionAllowedTypes = SLOT_TO_PLACE_TYPES[option];
    if (!optionAllowedTypes) {
      continue;
    }

    for (const type of optionAllowedTypes) {
      allowedTypes.add(type.toLowerCase());
    }
  }

  return [...allowedTypes];
}

function chooseTemplates(params: PlannedDateResultsParams, places: PlaceSummary[], activities: Activity[]): IdeaTemplate[] {
  const duration = getEffectiveDateDurationMinutes(params);
  const selectedCategories = params.categories || [];

  let base: IdeaTemplate[];
  if (duration <= 90) {
    base = SHORT_TEMPLATES;
  } else if (duration <= 180) {
    base = STANDARD_TEMPLATES;
  } else {
    base = LONG_TEMPLATES;
  }

  const matchesSelectedCategories = (template: IdeaTemplate) => templateMatchesSelectedCategories(template, selectedCategories);

  if (!places.length) {
    const stayInTemplates = getFreeStayInTemplates(duration, activities, params.maxPrice, params.maxDistance);

    const noPlaceTemplates = [...base, ...SHORT_TEMPLATES, ...STANDARD_TEMPLATES, ...LONG_TEMPLATES]
      .filter((template): template is IdeaTemplate => Boolean(template))
      .filter(matchesSelectedCategories)
      .filter((template, index, templates) => {
        if (requiresPlaces(template)) {
          return false;
        }

        return (
          templates.findIndex(
            (candidate) => candidate.template === template.template && candidate.slots.join(",") === template.slots.join(","),
          ) === index
        );
      });

    const filteredStayInTemplates = stayInTemplates.filter(matchesSelectedCategories);

    if (filteredStayInTemplates.length || noPlaceTemplates.length) {
      return [...filteredStayInTemplates, ...noPlaceTemplates];
    }

    return SHORT_TEMPLATES.filter((t) => !requiresPlaces(t) && matchesSelectedCategories(t));
  }

  const filtered = shuffleIdeas(base.filter(matchesSelectedCategories));

  if (selectedCategories.length <= 1) {
    return filtered;
  }

  // Bucket templates by category so each selected category gets equal representation
  // in the idea pool. Each template goes into the bucket of the one selected category
  // it uniquely matches; multi-category templates go to whichever selected-category
  // bucket is smallest at the time of assignment (balancing heuristic).
  const buckets = new Map<string, IdeaTemplate[]>(selectedCategories.map((cat) => [cat, []]));

  for (const template of filtered) {
    const matchingCategories = template.categories.filter((cat) => selectedCategories.includes(cat));

    if (!matchingCategories.length) {
      // Shouldn't happen after filter, but assign to first bucket as fallback
      buckets.get(selectedCategories[0])?.push(template);
      continue;
    }

    if (matchingCategories.length === 1) {
      buckets.get(matchingCategories[0])?.push(template);
      continue;
    }

    // Assign to the currently-smallest matching bucket so buckets stay balanced
    const target = matchingCategories.reduce((best, cat) => {
      const bestSize = buckets.get(best)?.length ?? 0;
      const catSize = buckets.get(cat)?.length ?? 0;
      return catSize < bestSize ? cat : best;
    });
    buckets.get(target)?.push(template);
  }

  // Round-robin across category buckets: one template per category per pass
  const result: IdeaTemplate[] = [];
  const bucketArrays = selectedCategories.map((cat) => buckets.get(cat) ?? []);
  let anyAdded = true;

  while (anyAdded) {
    anyAdded = false;
    for (const bucket of bucketArrays) {
      if (bucket.length > 0) {
        result.push(bucket.shift()!);
        anyAdded = true;
      }
    }
  }

  return result;
}

function getPlaceCandidatesBySlotType(slot: string, places: PlaceSummary[]): PlaceSummary[] {
  if (!places.length) {
    return [];
  }

  if (!slot) return places;

  const allowedTypes = getAllowedTypesForSlot(slot);
  if (!allowedTypes.length) {
    return [];
  }
  const allowedTypeSet = new Set(allowedTypes);

  const matchedPlaces = places.filter((place) => {
    const placeAny = place as any;
    const normalizedPrimaryType = typeof place.type === "string" ? place.type.toLowerCase() : "";
    const normalizedTypes = Array.isArray(placeAny.types)
      ? placeAny.types.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.toLowerCase())
      : [];

    if (normalizedPrimaryType && allowedTypeSet.has(normalizedPrimaryType)) {
      return true;
    }

    return normalizedTypes.some((type) => allowedTypeSet.has(type));
  });

  return matchedPlaces;
}

function toActivityPlaceSummary(activity: Activity): PlaceSummary {
  return {
    id: activity.id,
    name: activity.name,
    address: "",
    type: "activity",
    sourceKind: "activity",
    location: {
      latitude: null,
      longitude: null,
    },
  };
}

function getCandidatesForSlot(
  slot: string,
  places: PlaceSummary[],
  recipes: Recipe[],
  activities: Activity[],
  options?: {
    avoidFoodActivities?: boolean;
  },
): SlotCandidate[] {
  if (slot === "recipe") {
    return recipes
      .map((recipe) => {
        const recipeIndex = allRecipes.findIndex((candidate) => candidate.name === recipe.name);

        return {
          id: recipe.name,
          value: recipe.name,
          place: null,
          recipeIndex: recipeIndex >= 0 ? recipeIndex : undefined,
          minDurationMinutes: recipe.estimatedTime + 10,
          maxDurationMinutes: recipe.estimatedTime + 20,
        };
      })
      .filter((candidate) => Boolean(candidate.value));
  }

  if (slot === "activity") {
    const filteredActivities = options?.avoidFoodActivities
      ? activities.filter((activity) => !activity.categories.includes("Food"))
      : activities;

    return filteredActivities.map((activity) => ({
      id: activity.id,
      value: activity.name,
      place: toActivityPlaceSummary(activity),
      minDurationMinutes: activity.durationMinutes?.min,
      maxDurationMinutes: activity.durationMinutes?.max,
    }));
  }

  return getPlaceCandidatesBySlotType(slot, places).map((place) => ({
    id: place.id,
    value: place.name,
    place,
  }));
}

function chunkMinutesEvenly(totalMinutes: number, parts: number): number[] {
  if (parts <= 0) {
    return [];
  }

  const base = Math.floor(totalMinutes / parts);
  const remainder = totalMinutes % parts;
  return Array.from({ length: parts }, (_, index) => (index < remainder ? base + 1 : base));
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getIdeaSignature(idea: FilledIdea): string {
  return `${idea.filledTemplate}__${idea.template}`;
}

function shuffleIdeas<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function allocateSlotDurations(
  totalMinutes: number,
  entries: Array<{
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
  }>,
): number[] | null {
  if (!entries.length) {
    return [];
  }

  const minimums = entries.map((entry) => Math.max(0, entry.minDurationMinutes ?? 0));
  const caps = entries.map((entry) => entry.maxDurationMinutes ?? Number.POSITIVE_INFINITY);
  const minimumTotal = minimums.reduce((sum, value) => sum + value, 0);

  if (minimumTotal > totalMinutes) {
    return null;
  }

  if (minimums.some((minimum, index) => minimum > caps[index])) {
    return null;
  }

  const durations = [...minimums];
  let remainingMinutes = totalMinutes - minimumTotal;

  while (remainingMinutes > 0) {
    let assignedInPass = false;

    for (let index = 0; index < entries.length && remainingMinutes > 0; index += 1) {
      if (durations[index] >= caps[index]) {
        continue;
      }

      durations[index] += 1;
      remainingMinutes -= 1;
      assignedInPass = true;
    }

    if (!assignedInPass) {
      return null;
    }
  }

  return durations;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function estimateTravelMinutesBetween(from: PlaceSummary | null, to: PlaceSummary | null): number | null {
  const fromLat = from?.location?.latitude;
  const fromLon = from?.location?.longitude;
  const toLat = to?.location?.latitude;
  const toLon = to?.location?.longitude;

  if (typeof fromLat !== "number" || typeof fromLon !== "number" || typeof toLat !== "number" || typeof toLon !== "number") {
    return null;
  }

  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineMiles = earthRadiusMiles * c;

  const estimatedRoadMiles = straightLineMiles * 1.25;
  const averageCityMph = 25;
  const minutes = (estimatedRoadMiles / averageCityMph) * 60 + 5;

  return Math.max(5, Math.min(90, Math.round(minutes)));
}

export function estimateTravelMinutesFromUserLocation(
  userLocation: PlannedDateResultsParams["userLocation"],
  place: PlaceSummary | null,
): number | null {
  if (!userLocation || typeof userLocation.latitude !== "number" || typeof userLocation.longitude !== "number") {
    return null;
  }

  const pseudoUserPlace: PlaceSummary = {
    id: "user_location",
    name: "User Location",
    address: "",
    type: "place",
    sourceKind: "place",
    location: {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    },
  };

  return estimateTravelMinutesBetween(pseudoUserPlace, place);
}

function pickLeastUsedPlaceCandidate(candidates: SlotCandidate[], placeUsageById: Map<string, number>): SlotCandidate {
  const usageFor = (candidate: SlotCandidate) => {
    const placeId = candidate.place?.id;
    if (!placeId) {
      return Number.POSITIVE_INFINITY;
    }

    return placeUsageById.get(placeId) || 0;
  };

  const minimumUsage = candidates.reduce((min, candidate) => Math.min(min, usageFor(candidate)), Number.POSITIVE_INFINITY);
  const leastUsed = candidates.filter((candidate) => usageFor(candidate) === minimumUsage);

  return leastUsed[Math.floor(Math.random() * leastUsed.length)] || candidates[0];
}

function buildFilledIdea(
  template: IdeaTemplate,
  _combinationIndex: number,
  params: PlannedDateResultsParams,
  places: PlaceSummary[],
  recipes: Recipe[],
  activities: Activity[],
  placeUsageById: Map<string, number>,
): FilledIdea | null {
  if (!template || !Array.isArray(template.slots)) {
    return null;
  }

  const avoidFoodActivities = template.slots.includes("recipe");
  const slotCandidates = template.slots.map((slot) =>
    getCandidatesForSlot(slot, places, recipes, activities, {
      avoidFoodActivities,
    }),
  );

  if (slotCandidates.some((candidates) => !candidates.length)) {
    return null;
  }

  const selectedEntries: Array<{
    id?: string;
    slot: string;
    value: string;
    place: PlaceSummary | null;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
  }> = [];
  let selectedRecipeIndex: number | undefined;
  const usedActivityIds = new Set<string>();
  const usedPlaceIds = new Set<string>();

  for (let slotIndex = 0; slotIndex < template.slots.length; slotIndex += 1) {
    const slot = template.slots[slotIndex];
    const candidates = slotCandidates[slotIndex];
    const availableCandidates =
      slot === "activity"
        ? candidates.filter((candidate) => !candidate.id || !usedActivityIds.has(candidate.id))
        : slot !== "recipe"
          ? candidates.filter((candidate) => !candidate.place?.id || !usedPlaceIds.has(candidate.place.id))
          : candidates;
    const candidatePool = availableCandidates.length ? availableCandidates : candidates;

    const candidate =
      slot !== "activity" && slot !== "recipe"
        ? pickLeastUsedPlaceCandidate(candidatePool, placeUsageById)
        : candidatePool[Math.floor(Math.random() * candidatePool.length)];

    selectedEntries.push({
      id: candidate.id,
      slot,
      value: candidate.value,
      place: candidate.place,
      minDurationMinutes: candidate.minDurationMinutes,
      maxDurationMinutes: candidate.maxDurationMinutes,
    });

    if (slot === "activity" && candidate.id) {
      usedActivityIds.add(candidate.id);
    }

    if (slot !== "activity" && slot !== "recipe" && candidate.place?.id) {
      usedPlaceIds.add(candidate.place.id);
    }

    if (candidate.recipeIndex !== undefined) {
      selectedRecipeIndex = candidate.recipeIndex;
    }
  }

  let filledTemplate = template.template;
  const placeRecord: Record<string, PlaceSummary | null> = {};

  selectedEntries.forEach((entry, index) => {
    filledTemplate = filledTemplate.replace(`{${entry.slot}}`, entry.value);
    const key = `${entry.slot}_${index + 1}`;
    placeRecord[key] = entry.place;
  });

  const totalMinutes = getEffectiveDateDurationMinutes(params);

  const firstEntry = selectedEntries[0];
  const lastEntry = selectedEntries[selectedEntries.length - 1];

  const commuteToFirstMinutes =
    estimateTravelMinutesFromUserLocation(params.userLocation, firstEntry?.place || null) ??
    (firstEntry?.place?.sourceKind === "place" ? 10 : 0);

  const commuteFromLastMinutes =
    estimateTravelMinutesFromUserLocation(params.userLocation, lastEntry?.place || null) ??
    (lastEntry?.place?.sourceKind === "place" ? 10 : 0);

  const travelDurations = selectedEntries.map((entry, index) => {
    const nextEntry = selectedEntries[index + 1];
    if (!nextEntry) {
      return null;
    }

    const estimatedTravel = estimateTravelMinutesBetween(entry.place || null, nextEntry.place || null);

    if (estimatedTravel !== null) {
      return estimatedTravel;
    }

    return entry.place?.sourceKind === "place" || nextEntry.place?.sourceKind === "place" ? 10 : 0;
  });
  const totalTravelMinutes = travelDurations.reduce((sum, value) => sum + (value || 0), 0);
  const totalReservedTravelMinutes = totalTravelMinutes + commuteToFirstMinutes + commuteFromLastMinutes;
  if (totalReservedTravelMinutes > totalMinutes) {
    return null;
  }

  const availableActivityMinutes = totalMinutes - totalReservedTravelMinutes;
  const constrainedDurations = allocateSlotDurations(availableActivityMinutes, selectedEntries);
  const hasDurationConstraints = selectedEntries.some(
    (entry) => entry.minDurationMinutes !== undefined || entry.maxDurationMinutes !== undefined,
  );
  if (hasDurationConstraints && !constrainedDurations) {
    return null;
  }

  const slotDurations = constrainedDurations || chunkMinutesEvenly(availableActivityMinutes, Math.max(1, selectedEntries.length));

  const windowDurationMinutes = computeWindowDurationMinutes(params.startHour, params.endHour);
  const maxStartOffsetMinutes = Math.max(0, windowDurationMinutes - totalMinutes);
  const randomStartOffsetMinutes = getRandomQuarterHourOffset(maxStartOffsetMinutes);

  let currentMinute = params.startHour * 60 + randomStartOffsetMinutes + commuteToFirstMinutes;
  const schedule = selectedEntries.map((entry, index) => {
    const durationMinutes = slotDurations[index] || 0;
    const startMinute = currentMinute;
    const endMinute = currentMinute + durationMinutes;
    const travelToNextMinutes = travelDurations[index] ?? null;
    currentMinute = endMinute + (travelToNextMinutes || 0);

    return {
      title: entry.value,
      slot: entry.slot,
      startTime: formatTimeLabel(startMinute),
      endTime: formatTimeLabel(endMinute),
      durationMinutes,
      place: entry.place,
      travelToNextMinutes,
      minDurationMinutes: entry.minDurationMinutes,
      maxDurationMinutes: entry.maxDurationMinutes,
    };
  });

  return {
    template: template.template,
    filledTemplate,
    recipeIndex: selectedRecipeIndex !== undefined && selectedRecipeIndex >= 0 ? selectedRecipeIndex : undefined,
    commuteToFirstMinutes: commuteToFirstMinutes || null,
    commuteFromLastMinutes: commuteFromLastMinutes || null,
    places: placeRecord,
    schedule,
  };
}

function getCategoryForIdea(idea: FilledIdea, activities: Activity[]): string {
  const weights: Record<string, number> = {};
  for (const step of idea.schedule ?? []) {
    if (step.place?.sourceKind === "activity" && step.place.id) {
      const act = activities.find((a) => a.id === step.place!.id);
      if (act) {
        // Use the first non-Entertainment category to avoid activities inflating Entertainment
        const cat = act.categories.find((c) => c !== "Entertainment") ?? act.categories[0];
        if (cat) weights[cat] = (weights[cat] ?? 0) + 1;
      }
    } else if (step.place?.sourceKind === "place" && step.place.type) {
      const cat = SLOT_TO_CATEGORY[step.place.type];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 2;
    } else {
      const cat = SLOT_TO_CATEGORY[step.slot];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 1;
    }
  }
  let best = "Entertainment";
  let bestW = 0;
  for (const [cat, w] of Object.entries(weights)) {
    if (w > bestW) { best = cat; bestW = w; }
  }
  return best;
}

export default function useFilledIdeas({ params, places, recipes, activities }: UseFilledIdeasArgs): FilledIdea[] {
  const { isUnlocked } = usePremium();

  return useMemo(() => {
    const ideaGenerationStartMs = Date.now();
    const uniquePlaces = dedupeByKey(places, (place) => `${place.id}__${place.name}__${place.address}`);
    const uniqueRecipes = dedupeByKey(recipes, (recipe) => recipe.name);
    const uniqueActivities = dedupeByKey(activities, (activity) => `${activity.id}__${activity.name}`)
      .filter((activity) => activity.cost <= params.maxPrice);
    const randomizedPlaces = shuffleIdeas(uniquePlaces);
    const randomizedRecipes = shuffleIdeas(uniqueRecipes);
    const randomizedActivities = shuffleIdeas(uniqueActivities);
    const templates = chooseTemplates(params, randomizedPlaces, randomizedActivities);
    const targetCount = isUnlocked ? 25 : 10;
    const poolTargetCount = Math.max(targetCount * 4, 30);
    const ideas: FilledIdea[] = [];
    const seenIdeas = new Set<string>();
    const placeUsageById = new Map<string, number>();
    const maxAttempts = Math.max(poolTargetCount * templates.length * 25, 300);

    const buildStartMs = Date.now();
    let cursor = 0;
    while (ideas.length < poolTargetCount && cursor < maxAttempts) {
      const template = templates[cursor % templates.length];
      const combinationIndex = Math.floor(cursor / templates.length);
      const idea = buildFilledIdea(
        template,
        combinationIndex,
        params,
        randomizedPlaces,
        randomizedRecipes,
        randomizedActivities,
        placeUsageById,
      );
      if (idea) {
        const signature = getIdeaSignature(idea);
        if (!seenIdeas.has(signature)) {
          seenIdeas.add(signature);
          ideas.push(idea);

          Object.values(idea.places)
            .filter((place): place is PlaceSummary => Boolean(place?.id))
            .forEach((place) => {
              placeUsageById.set(place.id, (placeUsageById.get(place.id) || 0) + 1);
            });
        }
      }
      cursor += 1;
    }

    // Group pool by category, then round-robin to ensure even distribution
    const categoryBuckets = new Map<string, FilledIdea[]>();
    for (const idea of ideas) {
      const cat = getCategoryForIdea(idea, randomizedActivities);
      const bucket = categoryBuckets.get(cat) ?? [];
      bucket.push(idea);
      categoryBuckets.set(cat, bucket);
    }
    for (const bucket of categoryBuckets.values()) {
      shuffleIdeas(bucket);
    }
    const finalIdeas: FilledIdea[] = [];
    const buckets = [...categoryBuckets.values()];
    let anyAdded = true;
    while (finalIdeas.length < targetCount && anyAdded) {
      anyAdded = false;
      for (const bucket of buckets) {
        if (finalIdeas.length < targetCount && bucket.length > 0) {
          finalIdeas.push(bucket.shift()!);
          anyAdded = true;
        }
      }
    }
    return shuffleIdeas(finalIdeas);
  }, [activities, isUnlocked, params, places, recipes]);
}

function parseTimeLabel(label: string): number {
  const match = /^(\d+):(\d{2})\s+(AM|PM)$/.exec(label);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3] === "PM" && hours !== 12) hours += 12;
  if (match[3] === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function rebuildScheduleTimes(
  schedule: NonNullable<FilledIdea["schedule"]>,
  commuteToFirstMinutes: number,
  commuteFromLastMinutes: number,
  params: PlannedDateResultsParams,
): NonNullable<FilledIdea["schedule"]> {
  if (!schedule.length) return schedule;

  const totalMinutes = getEffectiveDateDurationMinutes(params);
  const totalTravelBetween = schedule.reduce((sum, step) => sum + (step.travelToNextMinutes || 0), 0);
  const totalReserved = totalTravelBetween + commuteToFirstMinutes + commuteFromLastMinutes;
  const availableActivityMinutes = Math.max(0, totalMinutes - totalReserved);

  const hasDurationConstraints = schedule.some(
    (step) => step.minDurationMinutes !== undefined || step.maxDurationMinutes !== undefined,
  );

  let slotDurations: number[];
  if (hasDurationConstraints) {
    const allocated = allocateSlotDurations(availableActivityMinutes, schedule);
    slotDurations = allocated ?? chunkMinutesEvenly(availableActivityMinutes, Math.max(1, schedule.length));
  } else {
    slotDurations = chunkMinutesEvenly(availableActivityMinutes, Math.max(1, schedule.length));
  }

  let currentMinute = parseTimeLabel(schedule[0].startTime);

  return schedule.map((step, index) => {
    const durationMinutes = slotDurations[index] || 0;
    const startMinute = currentMinute;
    const endMinute = startMinute + durationMinutes;
    currentMinute = endMinute + (step.travelToNextMinutes || 0);

    return {
      ...step,
      durationMinutes,
      startTime: formatTimeLabel(startMinute),
      endTime: formatTimeLabel(endMinute),
    };
  });
}

export {
  formatTimeLabel,
  estimateTravelMinutesBetween,
  getPlaceCandidatesBySlotType as getPlaceCandidatesBySlot,
  getCandidatesForSlot,
};
