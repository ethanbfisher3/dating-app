import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import activities, { Activity } from "../data/activities";
import recipes, { Recipe } from "../data/Recipes";
import type { DateCategory } from "src/utils/utils";

export type PlaceSummary = {
  id: string;
  name: string;
  address: string;
  types: string[];
  googleMapsUri: string;
  rating: number | null;
  sourceKind: "place" | "activity" | "recipe";
  location?: {
    latitude: number | null;
    longitude: number | null;
  };
};

function toPlannerWindowBounds(params: PlannedDateResultsParams): {
  start: number;
  end: number;
  selectedDateKey: string;
} | null {
  const parsed = new Date(`${toIsoDate(params.selectedDate)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const start = new Date(parsed);
  start.setHours(params.startHour, 0, 0, 0);

  const end = new Date(parsed);
  end.setHours(params.endHour, 0, 0, 0);
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  const selectedDateKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(parsed.getDate()).padStart(2, "0")}`;

  return { start: start.getTime(), end: end.getTime(), selectedDateKey };
}

function filterBYUEventsByPlannerWindow(events: BYUEventSummary[], params: PlannedDateResultsParams): BYUEventSummary[] {
  const bounds = toPlannerWindowBounds(params);
  if (!bounds) {
    return events;
  }

  return events.filter((event) => {
    if (!event.startDateTime) {
      return false;
    }

    const eventStart = new Date(event.startDateTime).getTime();
    if (Number.isNaN(eventStart)) {
      return false;
    }

    const eventStartDate = new Date(eventStart);
    const eventStartDateKey = `${eventStartDate.getFullYear()}-${String(eventStartDate.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(eventStartDate.getDate()).padStart(2, "0")}`;
    if (eventStartDateKey !== bounds.selectedDateKey) {
      return false;
    }

    const parsedEventEnd = event.endDateTime ? new Date(event.endDateTime).getTime() : Number.NaN;
    const eventEnd = Number.isNaN(parsedEventEnd) || parsedEventEnd <= eventStart ? eventStart + 60 * 60 * 1000 : parsedEventEnd;

    return eventStart < bounds.end && eventEnd > bounds.start;
  });
}

export type BYUEventSummary = {
  id: string;
  title: string;
  description: string;
  startDateTime: string | null;
  endDateTime: string | null;
  location: string;
  categories: string[];
  url: string;
  price: number | null;
};

type PlannerPlace = {
  id: string;
  types?: string[];
  formattedAddress?: string;
  googleMapsUri?: string;
  rating?: number;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
  displayName?: { text?: string };
};

const CATEGORY_TYPE_MAP: Record<string, string[]> = {
  Food: [
    "restaurant",
    "meal_takeaway",
    "cafe",
    "bakery",
    "ice_cream_shop",
    "dessert_restaurant",
    "coffee_shop",
    "pizza_restaurant",
    "sandwich_shop",
  ],
  Outdoors: ["park", "hiking_area", "campground", "nature_preserve", "river", "lake", "scenic_spot"],
  Sports: ["gym", "sports_club", "sports_complex", "sports_activity_location", "golf_course", "tennis_court"],
  Nature: ["park", "hiking_area", "lake", "river", "nature_preserve", "mountain_peak", "tourist_attraction"],
  Learning: ["museum", "library", "book_store", "art_gallery"],
  Shopping: ["shopping_mall", "department_store", "clothing_store", "gift_shop", "toy_store", "store"],
  Recreation: ["movie_theater", "tourist_attraction", "video_arcade", "amusement_park", "playground", "bowling_alley"],
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const BYU_EVENTS_URL = "https://calendar.byu.edu/api/Events.json?categories=all&price=1000";
const MAX_PLACES_RETURNED = 50;
const PRODUCTION_PLACES_SERVER_URL = "https://dating-app-server-9zib.onrender.com";
const PLACES_REQUEST_TIMEOUT_MS = 8000;

const PLACES_SERVER_BASE_URL = process.env.EXPO_PUBLIC_PLACES_SERVER_URL || process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

function getPlacesServerBaseUrls(): string[] {
  const unique = new Set<string>();

  unique.add(PLACES_SERVER_BASE_URL.replace(/\/$/, ""));
  unique.add(PRODUCTION_PLACES_SERVER_URL);

  return Array.from(unique);
}

function toServerSourceLabel(serverBaseUrl: string): string {
  if (serverBaseUrl === PRODUCTION_PLACES_SERVER_URL) {
    return "Places Server (Render)";
  }

  try {
    const host = new URL(serverBaseUrl).host;
    return `Places Server (${host})`;
  } catch {
    return `Places Server (${serverBaseUrl})`;
  }
}

async function fetchPlacesFromServer(params: PlannedDateResultsParams): Promise<{
  places: PlannerPlace[];
  fromCache: boolean;
  serverBaseUrl: string;
}> {
  if (!params.userLocation || params.maxDistance <= 0) {
    return {
      places: [],
      fromCache: true,
      serverBaseUrl: getPlacesServerBaseUrls()[0] || PLACES_SERVER_BASE_URL,
    };
  }

  const serverBaseUrls = getPlacesServerBaseUrls();
  const errors: string[] = [];

  for (const serverBaseUrl of serverBaseUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PLACES_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${serverBaseUrl}/places/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          userLocation: params.userLocation,
          maxDistance: params.maxDistance,
          maxPrice: params.maxPrice,
          categories: params.categories,
          maxResults: MAX_PLACES_RETURNED,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        errors.push(`${serverBaseUrl} -> ${response.status}: ${details || "request failed"}`);
        continue;
      }

      const payload = (await response.json()) as {
        places?: PlannerPlace[];
        meta?: { fromCache?: boolean };
      };

      return {
        places: Array.isArray(payload.places) ? payload.places : [],
        fromCache: Boolean(payload.meta?.fromCache),
        serverBaseUrl,
      };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        errors.push(`${serverBaseUrl} -> timeout after ${PLACES_REQUEST_TIMEOUT_MS}ms`);
      } else {
        errors.push(`${serverBaseUrl} -> ${error?.message || "network error"}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(`All places servers failed: ${errors.join(" | ") || "no reachable server"}`);
}

function toBYUEventPlaceSummary(event: BYUEventSummary): PlaceSummary {
  return {
    id: `byu_event_${event.id}`,
    name: event.title,
    address: event.location,
    types: ["tourist_attraction", "event", "byu_event"],
    googleMapsUri: event.url,
    rating: null,
    sourceKind: "place",
    location: {
      latitude: null,
      longitude: null,
    },
  };
}

function normalizeHour12(hour12: number, period: string): number {
  const hour = hour12 % 12;
  return period.toUpperCase() === "PM" ? hour + 12 : hour;
}

function isActivityTimeCompatible(activity: Activity, startHour: number, endHour: number): boolean {
  if (!Array.isArray(activity.bestTimesOfDay) || !activity.bestTimesOfDay.length) {
    return true;
  }

  const dateStart = startHour * 60;
  let dateEnd = endHour * 60;
  if (dateEnd <= dateStart) {
    dateEnd += 24 * 60;
  }

  return activity.bestTimesOfDay.some((range) => {
    const rangeStartHour = Number.parseInt(range.startHour12, 10);
    const rangeEndHour = Number.parseInt(range.endHour12, 10);
    if (Number.isNaN(rangeStartHour) || Number.isNaN(rangeEndHour)) {
      return true;
    }

    const start = normalizeHour12(rangeStartHour, range.startPeriod) * 60;
    let end = normalizeHour12(rangeEndHour, range.endPeriod) * 60;
    if (end <= start) {
      end += 24 * 60;
    }

    return start < dateEnd && end > dateStart;
  });
}

function getPlaceName(place: PlannerPlace): string {
  return place.displayName?.text || "Unknown place";
}

function toPlaceSummary(place: PlannerPlace): PlaceSummary {
  return {
    id: place.id,
    name: getPlaceName(place),
    address: place.formattedAddress || "",
    types: Array.isArray(place.types) ? place.types : [],
    googleMapsUri: place.googleMapsUri || "",
    rating: typeof place.rating === "number" ? place.rating : null,
    sourceKind: "place",
    location: {
      latitude: typeof place.location?.latitude === "number" ? place.location.latitude : null,
      longitude: typeof place.location?.longitude === "number" ? place.location.longitude : null,
    },
  };
}

const getAvailableAtHomeIdeas = (
  params: PlannedDateResultsParams,
): {
  recipes: Recipe[];
  activities: Activity[];
} => {
  const budget = typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice) ? params.maxPrice : Number.POSITIVE_INFINITY;

  const totalMinutes = computeWindowDurationMinutes(params.startHour, params.endHour);

  const parsedDate = new Date(`${toIsoDate(params.selectedDate)}T12:00:00`);
  const monthName = MONTHS[parsedDate.getMonth()] || "";
  const weekdayName = DAYS[parsedDate.getDay()] || "";

  const affordableRecipes = recipes.filter(
    (recipe) => params.categories.includes("Food") && recipe.estimatedPrice <= budget && recipe.estimatedTime <= totalMinutes,
  );

  const affordableActivities = activities
    .filter((activity) => activity.cost <= budget)
    .filter((activity) => activity.categories.some((category) => params.categories.includes(category as DateCategory)))
    .filter((activity) => {
      const minDuration = activity.durationMinutes?.min ?? 0;
      return minDuration <= totalMinutes;
    })
    .filter((activity) => {
      if (!activity.bestMonthsOfYear?.length) {
        return true;
      }

      return monthName ? activity.bestMonthsOfYear.includes(monthName) : true;
    })
    .filter((activity) => {
      if (!activity.bestDaysOfWeek?.length) {
        return true;
      }

      return weekdayName ? activity.bestDaysOfWeek.includes(weekdayName) : true;
    })
    .filter((activity) => isActivityTimeCompatible(activity, params.startHour, params.endHour));

  return { recipes: affordableRecipes, activities: affordableActivities };
};

function computeWindowDurationMinutes(startHour: number, endHour: number) {
  const start = startHour * 60;
  let end = endHour * 60;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function toIsoDate(dateString: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

export default function useDatePlannerIdeas(params: PlannedDateResultsParams): {
  places: PlaceSummary[];
  recipes: Recipe[];
  activities: Activity[];
  sourceFile: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [matchedPlaces, setMatchedPlaces] = useState<PlaceSummary[]>([]);
  const [sourceFile, setSourceFile] = useState("Places Server");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const atHomeOptions = useMemo(() => getAvailableAtHomeIdeas(params), [params]);

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (params.maxDistance <= 0 || !params.userLocation) {
        setMatchedPlaces([]);
        setSourceFile("");
      } else {
        const serverResult = await fetchPlacesFromServer(params);
        const serverPlaces = serverResult.places.map(toPlaceSummary);
        const combinedPlaces = dedupePlaceSummariesById(serverPlaces).slice(0, MAX_PLACES_RETURNED);
        const baseLabel = toServerSourceLabel(serverResult.serverBaseUrl);
        const placesSourceLabel = serverResult.fromCache ? `${baseLabel} Cache` : `${baseLabel} API`;

        setMatchedPlaces(combinedPlaces);
        setSourceFile(placesSourceLabel);
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch date planner ideas.");
      setMatchedPlaces([]);
      setSourceFile("");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return {
    places: matchedPlaces,
    recipes: atHomeOptions.recipes,
    activities: atHomeOptions.activities,
    sourceFile,
    isLoading,
    error,
    refetch: fetchIdeas,
  };
}

function dedupePlaceSummariesById(places: PlaceSummary[]): PlaceSummary[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}

export { useDatePlannerIdeas };
