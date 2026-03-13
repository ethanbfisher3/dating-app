import { useMemo } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import allRecipes, { Recipe } from "../data/Recipes";
import type { Activity } from "../data/activities";
import type { PlaceSummary } from "./usePlacesActivitiesRecipes";

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
  }>;
};

type IdeaTemplate = {
  template: string;
  slots: string[];
};

type UseFilledIdeasArgs = {
  params: PlannedDateResultsParams;
  places: PlaceSummary[];
  recipes: Recipe[];
  activities: Activity[];
};

const PLACE_SLOT_TYPES: Record<string, string[]> = {
  meal: ["restaurant", "meal_takeaway", "cafe", "pizza_restaurant"],
  dessert: ["bakery", "ice_cream_shop", "dessert_restaurant", "cafe"],
  park: ["park", "hiking_area", "nature_preserve", "lake", "river"],
  activityPlace: [
    "movie_theater",
    "video_arcade",
    "tourist_attraction",
    "sports_activity_location",
  ],
  learningSpot: ["museum", "library", "book_store", "art_gallery"],
  shop: ["shopping_mall", "department_store", "clothing_store", "store"],
};

const SHORT_TEMPLATES: IdeaTemplate[] = [
  { template: "Grab a bite at {meal}", slots: ["meal"] },
  { template: "Take a walk at {park}", slots: ["park"] },
  { template: "Do {activity} together", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  {
    template: "Do {activity} together, then cook {recipe}",
    slots: ["activity", "recipe"],
  },
];

const STANDARD_TEMPLATES: IdeaTemplate[] = [
  { template: "Start at {meal}, then walk at {park}", slots: ["meal", "park"] },
  {
    template: "Do {activity}, then grab dessert at {dessert}",
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
    template: "Browse {shop}, then end with {activity}",
    slots: ["shop", "activity"],
  },
];

const LONG_TEMPLATES: IdeaTemplate[] = [
  {
    template:
      "Start at {park}, eat at {meal}, do {activity}, and finish with dessert at {dessert}",
    slots: ["park", "meal", "activity", "dessert"],
  },
  {
    template:
      "Visit {learningSpot}, explore {shop}, then have dinner at {meal}",
    slots: ["learningSpot", "shop", "meal"],
  },
  {
    template: "Cook {recipe}, then go to {park}, and finish at {dessert}",
    slots: ["recipe", "park", "dessert"],
  },
];

function computeWindowDurationMinutes(startHour: number, endHour: number) {
  const start = startHour * 60;
  let end = endHour * 60;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function formatHourLabel(hour24: number): string {
  const normalized = ((hour24 % 24) + 24) % 24;
  const suffix = normalized < 12 ? "AM" : "PM";
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12}:00 ${suffix}`;
}

const PLACE_SLOTS = new Set(Object.keys(PLACE_SLOT_TYPES));

function requiresPlaces(template: IdeaTemplate): boolean {
  return template.slots.some((slot) => PLACE_SLOTS.has(slot));
}

function chooseTemplates(
  params: PlannedDateResultsParams,
  places: PlaceSummary[],
): IdeaTemplate[] {
  const duration = computeWindowDurationMinutes(
    params.startHour,
    params.endHour,
  );

  let base: IdeaTemplate[];
  if (duration <= 120) {
    base = SHORT_TEMPLATES;
  } else if (duration <= 240) {
    base = STANDARD_TEMPLATES;
  } else {
    base = LONG_TEMPLATES;
  }

  if (!places.length) {
    // Only keep templates that don't need any place slots
    const noPlaceTemplates = base.filter((t) => !requiresPlaces(t));
    if (noPlaceTemplates.length) {
      return noPlaceTemplates;
    }
    // Fall back to the activity/recipe-only templates from SHORT_TEMPLATES
    return SHORT_TEMPLATES.filter((t) => !requiresPlaces(t));
  }

  return base;
}

function matchPlaceBySlot(
  slot: string,
  places: PlaceSummary[],
  offset: number,
): PlaceSummary | null {
  if (!places.length) {
    return null;
  }

  const allowedTypes = PLACE_SLOT_TYPES[slot];
  if (!allowedTypes) {
    return places[offset % places.length] || null;
  }

  const candidates = places.filter((place) =>
    place.types.some((type) => allowedTypes.includes(type)),
  );

  if (!candidates.length) {
    return null;
  }

  return candidates[offset % candidates.length] || null;
}

function chunkMinutesEvenly(totalMinutes: number, parts: number): number[] {
  if (parts <= 0) {
    return [];
  }

  const base = Math.floor(totalMinutes / parts);
  const remainder = totalMinutes % parts;
  return Array.from({ length: parts }, (_, index) =>
    index < remainder ? base + 1 : base,
  );
}

function buildFilledIdea(
  template: IdeaTemplate,
  ideaIndex: number,
  params: PlannedDateResultsParams,
  places: PlaceSummary[],
  recipes: Recipe[],
  activities: Activity[],
): FilledIdea | null {
  const selectedEntries: Array<{
    slot: string;
    value: string;
    place: PlaceSummary | null;
  }> = [];
  let selectedRecipeIndex: number | undefined;

  for (let slotIndex = 0; slotIndex < template.slots.length; slotIndex += 1) {
    const slot = template.slots[slotIndex];

    if (slot === "recipe") {
      if (!recipes.length) {
        return null;
      }

      const recipe = recipes[(ideaIndex + slotIndex) % recipes.length];
      selectedRecipeIndex = allRecipes.findIndex(
        (candidate) => candidate.name === recipe.name,
      );
      selectedEntries.push({
        slot,
        value: recipe.name,
        place: null,
      });
      continue;
    }

    if (slot === "activity") {
      if (!activities.length) {
        return null;
      }

      const activity = activities[(ideaIndex + slotIndex) % activities.length];
      selectedEntries.push({
        slot,
        value: activity.name,
        place: {
          id: activity.id,
          name: activity.name,
          address: "",
          types: ["activity"],
          googleMapsUri: "",
          rating: null,
          sourceKind: "activity",
          location: {
            latitude: null,
            longitude: null,
          },
        },
      });
      continue;
    }

    const place = matchPlaceBySlot(slot, places, ideaIndex + slotIndex);
    if (!place) {
      return null;
    }

    selectedEntries.push({
      slot,
      value: place.name,
      place,
    });
  }

  let filledTemplate = template.template;
  const placeRecord: Record<string, PlaceSummary | null> = {};

  selectedEntries.forEach((entry, index) => {
    filledTemplate = filledTemplate.replace(`{${entry.slot}}`, entry.value);
    const key = `${entry.slot}_${index + 1}`;
    placeRecord[key] = entry.place;
  });

  const totalMinutes = computeWindowDurationMinutes(
    params.startHour,
    params.endHour,
  );
  const slotDurations = chunkMinutesEvenly(
    totalMinutes,
    Math.max(1, selectedEntries.length),
  );

  let currentMinute = params.startHour * 60;
  const schedule = selectedEntries.map((entry, index) => {
    const durationMinutes = slotDurations[index] || 0;
    const startMinute = currentMinute;
    const endMinute = currentMinute + durationMinutes;
    currentMinute = endMinute;

    const startHour24 = Math.floor((startMinute / 60) % 24);
    const endHour24 = Math.floor((endMinute / 60) % 24);

    return {
      title: entry.value,
      slot: entry.slot,
      startTime: formatHourLabel(startHour24),
      endTime: formatHourLabel(endHour24),
      durationMinutes,
      place: entry.place,
      travelToNextMinutes: index === selectedEntries.length - 1 ? null : 10,
    };
  });

  return {
    template: template.template,
    filledTemplate,
    recipeIndex:
      selectedRecipeIndex !== undefined && selectedRecipeIndex >= 0
        ? selectedRecipeIndex
        : undefined,
    commuteToFirstMinutes: null,
    commuteFromLastMinutes: null,
    places: placeRecord,
    schedule,
  };
}

export default function useFilledIdeas({
  params,
  places,
  recipes,
  activities,
}: UseFilledIdeasArgs): FilledIdea[] {
  return useMemo(() => {
    const templates = chooseTemplates(params, places);
    const targetCount = 10;
    const ideas: FilledIdea[] = [];

    let cursor = 0;
    while (ideas.length < targetCount && cursor < targetCount * 4) {
      const template = templates[cursor % templates.length];
      const idea = buildFilledIdea(
        template,
        cursor,
        params,
        places,
        recipes,
        activities,
      );
      if (idea) {
        ideas.push(idea);
      }
      cursor += 1;
    }

    return ideas;
  }, [activities, params, places, recipes]);
}
