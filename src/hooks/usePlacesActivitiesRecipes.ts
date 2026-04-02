import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import activities, { Activity } from "../data/activities";
import recipes, { Recipe } from "../data/Recipes";
import type { DateCategory } from "src/utils/utils";

export type PlaceSummary = PlannerPlace & {
  sourceKind: "place" | "activity" | "recipe";
};

export type PlacesSearchResponse = {
  count: number;
  places: PlannerPlace[];
  meta: {
    fromCache: boolean;
    source: string;
  };
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

type JsonObject = Record<string, unknown>;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MAX_PLACES_RETURNED = 50;
const PRODUCTION_PLACES_SERVER_URL = "https://dating-app-server-9zib.onrender.com";
const PLACES_REQUEST_TIMEOUT_MS = 30000;
const ENABLE_PRODUCTION_FALLBACK = process.env.EXPO_PUBLIC_ENABLE_PRODUCTION_FALLBACK === "true";

const PLACES_SERVER_BASE_URL =
  process.env.EXPO_PUBLIC_PLACES_SERVER_URL || process.env.EXPO_PUBLIC_API_BASE_URL || PRODUCTION_PLACES_SERVER_URL;

function getPlacesServerBaseUrls(serverTarget: string): string[] {
  const unique = new Set<string>();

  if (serverTarget === "render") {
    unique.add(PRODUCTION_PLACES_SERVER_URL);
    return Array.from(unique);
  }

  const normalizedBase = PLACES_SERVER_BASE_URL.replace(/\/$/, "");
  const parsedBase = (() => {
    try {
      return new URL(normalizedBase);
    } catch {
      return null;
    }
  })();

  const basePort = parsedBase?.port ? `:${parsedBase.port}` : "";
  const protocol = parsedBase?.protocol === "https:" ? "https" : "http";

  const localCandidates = new Set<string>();

  localCandidates.add(normalizedBase);

  if (parsedBase) {
    const hostname = parsedBase.hostname;

    if (hostname === "localhost") {
      localCandidates.add(`${protocol}://127.0.0.1${basePort}`);
      localCandidates.add(`${protocol}://10.0.2.2${basePort}`);
    }

    if (hostname === "127.0.0.1") {
      localCandidates.add(`${protocol}://localhost${basePort}`);
      localCandidates.add(`${protocol}://10.0.2.2${basePort}`);
    }

    if (hostname === "10.0.2.2") {
      localCandidates.add(`${protocol}://localhost${basePort}`);
      localCandidates.add(`${protocol}://127.0.0.1${basePort}`);
    }
  }

  for (const url of localCandidates) {
    unique.add(url.replace(/\/$/, ""));
  }

  if (ENABLE_PRODUCTION_FALLBACK) {
    unique.add(PRODUCTION_PLACES_SERVER_URL);
  }

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

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

async function fetchPlacesFromServer(params: PlannedDateResultsParams): Promise<{
  winner: {
    places: PlannerPlace[];
    fromCache: boolean;
    serverBaseUrl: string;
  } | null;
  responses: PlacesServerResponse[];
}> {
  const serverBaseUrls = getPlacesServerBaseUrls(params.serverTarget ?? "localhost");
  const responses: PlacesServerResponse[] = [];

  if (!params.userLocation || params.maxDistance <= 0) {
    return {
      winner: {
        places: [],
        fromCache: true,
        serverBaseUrl: serverBaseUrls[0] || PLACES_SERVER_BASE_URL,
      },
      responses,
    };
  }

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
        responses.push({
          serverBaseUrl,
          serverLabel: toServerSourceLabel(serverBaseUrl),
          ok: false,
          statusCode: response.status,
          details: details || "request failed",
        });
        continue;
      }

      const payload = (await response.json()) as PlacesSearchResponse;

      responses.push({
        serverBaseUrl,
        serverLabel: toServerSourceLabel(serverBaseUrl),
        ok: true,
        statusCode: response.status,
        details: payload.meta.fromCache ? "OK (cache hit)" : "OK (live fetch)",
      });

      return {
        winner: {
          places: payload.places,
          fromCache: payload.meta.fromCache,
          serverBaseUrl,
        },
        responses,
      };
    } catch (error: any) {
      if (error?.name === "AbortError") {
        responses.push({
          serverBaseUrl,
          serverLabel: toServerSourceLabel(serverBaseUrl),
          ok: false,
          statusCode: null,
          details: `timeout after ${PLACES_REQUEST_TIMEOUT_MS}ms`,
        });
      } else {
        responses.push({
          serverBaseUrl,
          serverLabel: toServerSourceLabel(serverBaseUrl),
          ok: false,
          statusCode: null,
          details: error?.message || "network error",
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    winner: null,
    responses,
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
  serverResponses: PlacesServerResponse[];
  refetch: () => void;
} {
  const [matchedPlaces, setMatchedPlaces] = useState<PlaceSummary[]>([]);
  const [sourceFile, setSourceFile] = useState("Places Server");
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
        const serverResult = await fetchPlacesFromServer(params);
        setServerResponses(serverResult.responses);

        if (!serverResult.winner) {
          setError("Could not load places from localhost or Render server.");
          setMatchedPlaces([]);
          setSourceFile("");
          return;
        }

        const serverPlaces = serverResult.winner.places.map(toPlaceSummary);
        const combinedPlaces = dedupePlaceSummariesById(serverPlaces).slice(0, MAX_PLACES_RETURNED);
        const baseLabel = toServerSourceLabel(serverResult.winner.serverBaseUrl);
        const placesSourceLabel = serverResult.winner.fromCache ? `${baseLabel} Cache` : `${baseLabel} API`;

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
