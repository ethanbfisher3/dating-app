import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import activities, { Activity } from "../data/activities";
import recipes, { Recipe } from "../data/Recipes";
import type { DateCategory } from "src/utils/utils";
import createOverpassQuery from "../data/overpass/overpass";

export type PlaceSummary = PlannerPlace & {
  sourceKind: "place" | "activity" | "recipe";
};

export type PlacesServerResponse = {
  serverBaseUrl: string;
  serverLabel: string;
  ok: boolean;
  statusCode: number | null;
  details: string;
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

export type PlannerPlace = {
  id: string;
  type: string;
  address: string;
  location: { latitude?: number; longitude?: number };
  name: string;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MAX_PLACES_RETURNED = 50;
const OVERPASS_INTERPRETER_URL = process.env.EXPO_PUBLIC_OVERPASS_INTERPRETER_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_REQUEST_TIMEOUT_MS = 30000;
const METERS_PER_MILE = 1609.34;

const SUPPORTED_DATE_CATEGORIES = new Set<DateCategory>(["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"]);

function toSourceLabel(baseUrl: string): string {
  try {
    const host = new URL(baseUrl).host;
    return `Overpass API (${host})`;
  } catch {
    return `Overpass API (${baseUrl})`;
  }
}

function toSupportedDateCategories(categories: string[]): DateCategory[] {
  return categories.filter((category): category is DateCategory => SUPPORTED_DATE_CATEGORIES.has(category as DateCategory));
}

function toPlaceTypeFromTags(tags: Record<string, string>): string {
  return (
    tags.amenity || tags.leisure || tags.shop || tags.sport || tags.tourism || tags.historic || tags.highway || tags.natural || "place"
  );
}

function toAddressFromTags(tags: Record<string, string>): string {
  const fullAddress = tags["addr:full"];
  if (fullAddress) {
    return fullAddress;
  }

  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  return parts.join(" ");
}

function toPlannerPlaceFromOverpassElement(element: OverpassElement): PlannerPlace | null {
  if (!element.tags) {
    return null;
  }

  const lat = typeof element.lat === "number" ? element.lat : element.center?.lat;
  const lon = typeof element.lon === "number" ? element.lon : element.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }

  const name = element.tags.name?.trim();
  if (!name) {
    return null;
  }

  const type = toPlaceTypeFromTags(element.tags);
  const address = toAddressFromTags(element.tags);

  return {
    id: `${element.type}:${element.id}`,
    name,
    type,
    address,
    location: {
      latitude: lat,
      longitude: lon,
    },
  };
}

async function fetchPlacesFromOverpass(params: PlannedDateResultsParams): Promise<{
  winner: {
    places: PlannerPlace[];
    fromCache: boolean;
    serverBaseUrl: string;
  } | null;
  responses: PlacesServerResponse[];
}> {
  const responses: PlacesServerResponse[] = [];

  if (!params.userLocation || params.maxDistance <= 0) {
    return {
      winner: {
        places: [],
        fromCache: false,
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
      },
      responses,
    };
  }

  const categories = toSupportedDateCategories(params.categories || []);
  if (!categories.length) {
    return {
      winner: {
        places: [],
        fromCache: false,
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
      },
      responses,
    };
  }

  const distanceMeters = Math.max(0, Math.round(params.maxDistance * METERS_PER_MILE));
  if (distanceMeters <= 0) {
    return {
      winner: {
        places: [],
        fromCache: false,
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
      },
      responses,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OVERPASS_REQUEST_TIMEOUT_MS);
  try {
    const query = createOverpassQuery(
      categories,
      {
        lat: params.userLocation.latitude,
        lon: params.userLocation.longitude,
      },
      distanceMeters,
    );

    const response = await fetch(OVERPASS_INTERPRETER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      signal: controller.signal,
      body: query,
    });

    if (!response.ok) {
      const details = await response.text();
      responses.push({
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
        serverLabel: toSourceLabel(OVERPASS_INTERPRETER_URL),
        ok: false,
        statusCode: response.status,
        details: details || "request failed",
      });

      return {
        winner: null,
        responses,
      };
    }

    const payload = (await response.json()) as OverpassResponse;
    const places = (payload.elements || []).map(toPlannerPlaceFromOverpassElement).filter((place): place is PlannerPlace => Boolean(place));

    responses.push({
      serverBaseUrl: OVERPASS_INTERPRETER_URL,
      serverLabel: toSourceLabel(OVERPASS_INTERPRETER_URL),
      ok: true,
      statusCode: response.status,
      details: `OK (${places.length} places)`,
    });

    return {
      winner: {
        places,
        fromCache: false,
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
      },
      responses,
    };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      responses.push({
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
        serverLabel: toSourceLabel(OVERPASS_INTERPRETER_URL),
        ok: false,
        statusCode: null,
        details: `timeout after ${OVERPASS_REQUEST_TIMEOUT_MS}ms`,
      });
    } else {
      responses.push({
        serverBaseUrl: OVERPASS_INTERPRETER_URL,
        serverLabel: toSourceLabel(OVERPASS_INTERPRETER_URL),
        ok: false,
        statusCode: null,
        details: error?.message || "network error",
      });
    }

    return {
      winner: null,
      responses,
    };
  } finally {
    clearTimeout(timeoutId);
  }
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

function toPlaceSummary(place: PlannerPlace): PlaceSummary {
  return {
    ...place,
    sourceKind: "place",
  };
}

const getAvailableAtHomeIdeas = (
  params: PlannedDateResultsParams,
): {
  recipes: Recipe[];
  activities: Activity[];
} => {
  const budget = typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice) ? params.maxPrice : Number.POSITIVE_INFINITY;

  const totalMinutes = getEffectiveDateDurationMinutes(params);

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

function getEffectiveDateDurationMinutes(params: PlannedDateResultsParams): number {
  const windowDuration = computeWindowDurationMinutes(params.startHour, params.endHour);
  const requestedDuration =
    typeof params.dateLengthMinutes === "number" && params.dateLengthMinutes > 0 ? params.dateLengthMinutes : windowDuration;

  return Math.min(windowDuration, requestedDuration);
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
  serverResponses: PlacesServerResponse[];
  refetch: () => void;
} {
  const [matchedPlaces, setMatchedPlaces] = useState<PlaceSummary[]>([]);
  const [sourceFile, setSourceFile] = useState("Overpass API");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverResponses, setServerResponses] = useState<PlacesServerResponse[]>([]);

  const atHomeOptions = useMemo(() => getAvailableAtHomeIdeas(params), [params]);

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (params.maxDistance <= 0 || !params.userLocation) {
        setMatchedPlaces([]);
        setSourceFile("");
        setServerResponses([]);
      } else {
        const serverResult = await fetchPlacesFromOverpass(params);
        setServerResponses(serverResult.responses);

        if (!serverResult.winner) {
          setError("Could not load places from Overpass API.");
          setMatchedPlaces([]);
          setSourceFile("");
          return;
        }

        const serverPlaces = serverResult.winner.places.map(toPlaceSummary);
        const combinedPlaces = dedupePlaceSummariesById(serverPlaces).slice(0, MAX_PLACES_RETURNED);
        const placesSourceLabel = toSourceLabel(serverResult.winner.serverBaseUrl);

        setMatchedPlaces(combinedPlaces);
        setSourceFile(placesSourceLabel);
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch date planner ideas.");
      setMatchedPlaces([]);
      setSourceFile("");
      setServerResponses([]);
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
    serverResponses,
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
