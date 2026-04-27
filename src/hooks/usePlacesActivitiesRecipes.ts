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

type OverpassCoordinate = {
  lat: number;
  lon: number;
};

type OverpassElementBase = {
  id: number;
  type: "node" | "way" | "relation";
  tags?: Record<string, string>;
};

type OverpassNodeElement = OverpassElementBase & {
  type: "node";
  lat: number;
  lon: number;
  center?: OverpassCoordinate;
};

type OverpassWayElement = OverpassElementBase & {
  type: "way";
  nodes?: number[];
  geometry?: OverpassCoordinate[];
  center?: OverpassCoordinate;
  bounds?: {
    minlat: number;
    minlon: number;
    maxlat: number;
    maxlon: number;
  };
};

type OverpassRelationMember = {
  type: "node" | "way" | "relation";
  ref: number;
  role?: string;
  geometry?: OverpassCoordinate[];
  lat?: number;
  lon?: number;
};

type OverpassRelationElement = OverpassElementBase & {
  type: "relation";
  members?: OverpassRelationMember[];
  geometry?: OverpassCoordinate[];
  center?: OverpassCoordinate;
  bounds?: {
    minlat: number;
    minlon: number;
    maxlat: number;
    maxlon: number;
  };
};

type OverpassElement = OverpassNodeElement | OverpassWayElement | OverpassRelationElement;

type OverpassResponse = {
  version?: number;
  generator?: string;
  osm3s?: {
    timestamp_osm_base?: string;
    timestamp_areas_base?: string;
    copyright?: string;
  };
  elements?: OverpassElement[];
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MAX_PLACES_RETURNED = 50;
const OVERPASS_RESULTS_PER_CATEGORY = 8;
const OVERPASS_QUERY_RADIUS_METERS = 800;
const OVERPASS_INTERPRETER_URL = process.env.EXPO_PUBLIC_OVERPASS_INTERPRETER_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_FALLBACK_URLS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  OVERPASS_INTERPRETER_URL,
];
const OVERPASS_REQUEST_TIMEOUT_MS = 12000;
const METERS_PER_MILE = 1609.34;
const SUPPORTED_DATE_CATEGORIES = new Set<DateCategory>(["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"]);
const OVERPASS_DEBUG_PREFIX = "[usePlacesActivitiesRecipes]";

function logOverpassDebug(message: string, details?: unknown) {
  console.log(OVERPASS_DEBUG_PREFIX, message, details ?? "");
}

function summarizeOverpassElements(elements: OverpassElement[]) {
  let nodes = 0;
  let ways = 0;
  let relations = 0;
  let withTags = 0;
  let withCoordinate = 0;
  let withCenter = 0;
  let withGeometry = 0;
  let withMembers = 0;

  for (const element of elements) {
    if (element.type === "node") nodes += 1;
    if (element.type === "way") ways += 1;
    if (element.type === "relation") relations += 1;
    if (element.tags) withTags += 1;
    if (element.type === "node") {
      withCoordinate += 1;
      continue;
    }

    if (element.center) {
      withCoordinate += 1;
      withCenter += 1;
    }

    if (element.geometry?.length) {
      withGeometry += 1;
    }

    if (element.type === "relation" && element.members?.length) {
      withMembers += 1;
    }
  }

  return {
    total: elements.length,
    nodes,
    ways,
    relations,
    withTags,
    withCoordinate,
    withCenter,
    withGeometry,
    withMembers,
  };
}

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

function getRandomPointWithinRadius(
  center: { latitude: number; longitude: number },
  radiusMeters: number,
): {
  latitude: number;
  longitude: number;
} {
  const earthRadiusMeters = 6371000;
  const distance = radiusMeters * Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  const centerLatitudeRadians = (center.latitude * Math.PI) / 180;

  const deltaLatitude = (distance * Math.cos(angle)) / earthRadiusMeters;
  const deltaLongitude = (distance * Math.sin(angle)) / (earthRadiusMeters * Math.max(Math.cos(centerLatitudeRadians), 0.000001));

  return {
    latitude: center.latitude + (deltaLatitude * 180) / Math.PI,
    longitude: center.longitude + (deltaLongitude * 180) / Math.PI,
  };
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

function toDisplayName(element: OverpassElement, tags: Record<string, string>): string | null {
  const rawName = tags.name?.trim() || tags.brand?.trim() || tags.operator?.trim() || tags.official_name?.trim();
  if (rawName) {
    return rawName;
  }

  return null;
}

function getElementCoordinate(element: OverpassElement): OverpassCoordinate | null {
  if (element.type === "node") {
    return { lat: element.lat, lon: element.lon };
  }

  if (element.center && typeof element.center.lat === "number" && typeof element.center.lon === "number") {
    return element.center;
  }

  const geometryPoint = element.geometry?.find((point) => typeof point.lat === "number" && typeof point.lon === "number");
  if (geometryPoint) {
    return geometryPoint;
  }

  if (element.type === "relation") {
    for (const member of element.members || []) {
      if (typeof member.lat === "number" && typeof member.lon === "number") {
        return { lat: member.lat, lon: member.lon };
      }

      const memberGeometryPoint = member.geometry?.find((point) => typeof point.lat === "number" && typeof point.lon === "number");
      if (memberGeometryPoint) {
        return memberGeometryPoint;
      }
    }
  }

  return null;
}

function toPlannerPlaceFromOverpassElement(element: OverpassElement): PlannerPlace | null {
  if (!element.tags) {
    return null;
  }

  const coordinate = getElementCoordinate(element);
  if (!coordinate) {
    return null;
  }

  const type = toPlaceTypeFromTags(element.tags);
  const address = toAddressFromTags(element.tags);
  const name = toDisplayName(element, element.tags);

  if (!name) {
    return null;
  }

  return {
    id: `${element.type}:${element.id}`,
    name,
    type,
    address,
    location: {
      latitude: coordinate.lat,
      longitude: coordinate.lon,
    },
  };
}

async function fetchPlacesForCategoryFromOverpass(
  category: DateCategory,
  params: PlannedDateResultsParams,
  distanceMeters: number,
  uniqueOverpassUrls: string[],
  responses: PlacesServerResponse[],
): Promise<{
  category: DateCategory;
  places: PlannerPlace[];
  hadSuccess: boolean;
  serverBaseUrl: string | null;
}> {
  const queryCenter = getRandomPointWithinRadius(params.userLocation, distanceMeters);
  const queryRadiusMeters = Math.max(350, Math.min(OVERPASS_QUERY_RADIUS_METERS, Math.round(distanceMeters * 0.2)));
  const query = createOverpassQuery(
    [category],
    {
      lat: queryCenter.latitude,
      lon: queryCenter.longitude,
    },
    queryRadiusMeters,
    OVERPASS_RESULTS_PER_CATEGORY,
  );

  const requestAttempts: Array<{
    label: string;
    contentType: string;
    body: string;
    method: "POST" | "GET";
    toRequestUrl: (baseUrl: string) => string;
  }> = [
    {
      label: "post-form-encoded",
      method: "POST",
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      body: `data=${encodeURIComponent(query)}`,
      toRequestUrl: (baseUrl: string) => baseUrl,
    },
    {
      label: "get-query-param",
      method: "GET",
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      body: "",
      toRequestUrl: (baseUrl: string) => `${baseUrl}?data=${encodeURIComponent(query)}`,
    },
  ];

  logOverpassDebug("category query prepared", {
    category,
    queryCenter,
    queryRadiusMeters,
    queryLength: query.length,
    queryPreview: query.slice(0, 300),
  });

  for (const serverBaseUrl of uniqueOverpassUrls) {
    for (const attempt of requestAttempts) {
      const requestUrl = attempt.toRequestUrl(serverBaseUrl);
      const attemptController = new AbortController();
      const attemptTimeoutId = setTimeout(() => attemptController.abort(), OVERPASS_REQUEST_TIMEOUT_MS);

      logOverpassDebug("sending Overpass request", {
        category,
        serverBaseUrl,
        requestUrl,
        attempt: attempt.label,
        method: attempt.method,
        contentType: attempt.contentType,
        bodyLength: attempt.body.length,
        queryCenter,
        queryRadiusMeters,
      });

      const attemptStart = Date.now();
      const resultPromise = fetch(requestUrl, {
        method: attempt.method,
        headers: {
          "Content-Type": attempt.contentType,
          Accept: "application/json, text/plain, */*",
        },
        signal: attemptController.signal,
        body: attempt.method === "POST" ? attempt.body : undefined,
      })
        .then(async (response) => {
          const elapsedMs = Date.now() - attemptStart;
          if (!response.ok) {
            const details = await response.text();
            responses.push({
              serverBaseUrl,
              serverLabel: toSourceLabel(serverBaseUrl),
              ok: false,
              statusCode: response.status,
              details: `[${category}][${attempt.label}] ${details || "request failed"}`,
            });

            logOverpassDebug("overpass request failed", {
              category,
              serverBaseUrl,
              attempt: attempt.label,
              method: attempt.method,
              statusCode: response.status,
              elapsedMs,
              detailPreview: (details || "").slice(0, 300),
            });
            return null;
          }

          const parseStart = Date.now();
          const payload = (await response.json()) as OverpassResponse;
          const parseMs = Date.now() - parseStart;
          const elements = payload.elements || [];
          logOverpassDebug("overpass payload summary", {
            category,
            serverBaseUrl,
            attempt: attempt.label,
            method: attempt.method,
            elapsedMs,
            parseMs,
            summary: summarizeOverpassElements(elements),
          });

          const places = elements.map(toPlannerPlaceFromOverpassElement).filter((place): place is PlannerPlace => Boolean(place));

          responses.push({
            serverBaseUrl,
            serverLabel: toSourceLabel(serverBaseUrl),
            ok: true,
            statusCode: response.status,
            details: `[${category}][${attempt.label}] OK (${places.length} places) (${elapsedMs}ms)`,
          });

          return places;
        })
        .catch(async (error: any) => {
          const elapsedMs = Date.now() - attemptStart;
          if (error?.name === "AbortError") {
            responses.push({
              serverBaseUrl,
              serverLabel: toSourceLabel(serverBaseUrl),
              ok: false,
              statusCode: null,
              details: `[${category}][${attempt.label}] timeout after ${OVERPASS_REQUEST_TIMEOUT_MS}ms`,
            });

            logOverpassDebug("overpass request timed out", {
              category,
              serverBaseUrl,
              attempt: attempt.label,
              method: attempt.method,
              timeoutMs: OVERPASS_REQUEST_TIMEOUT_MS,
              elapsedMs,
            });
            return null;
          }

          responses.push({
            serverBaseUrl,
            serverLabel: toSourceLabel(serverBaseUrl),
            ok: false,
            statusCode: null,
            details: `[${category}][${attempt.label}] ${error?.message || "network error"}`,
          });

          logOverpassDebug("overpass request errored", {
            category,
            serverBaseUrl,
            attempt: attempt.label,
            method: attempt.method,
            message: error?.message,
            stack: error?.stack,
            elapsedMs,
          });

          return null;
        })
        .finally(() => {
          clearTimeout(attemptTimeoutId);
        });

      const places = await resultPromise;
      if (places !== null) {
        return {
          category,
          places,
          hadSuccess: true,
          serverBaseUrl,
        };
      }
    }
  }

  return {
    category,
    places: [],
    hadSuccess: false,
    serverBaseUrl: null,
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
  const uniqueOverpassUrls = Array.from(new Set(OVERPASS_FALLBACK_URLS.filter(Boolean)));
  const placesByCategory = new Map<DateCategory, PlannerPlace[]>();
  let firstSuccessfulServerBaseUrl: string | null = null;

  if (!params.userLocation || params.maxDistance <= 0) {
    return {
      winner: {
        places: [],
        fromCache: false,
        serverBaseUrl: uniqueOverpassUrls[0] || OVERPASS_INTERPRETER_URL,
      },
      responses,
    };
  }

  let categories = toSupportedDateCategories(params.categories || []);
  if (typeof params.maxPrice === "number" && params.maxPrice <= 0) {
    logOverpassDebug("excluding categories due to zero budget", { requestedCategories: params.categories });
    categories = categories.filter((c) => c !== "Food" && c !== "Shopping");
  }
  if (!categories.length) {
    return {
      winner: {
        places: [],
        fromCache: false,
        serverBaseUrl: uniqueOverpassUrls[0] || OVERPASS_INTERPRETER_URL,
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
        serverBaseUrl: uniqueOverpassUrls[0] || OVERPASS_INTERPRETER_URL,
      },
      responses,
    };
  }

  try {
    const categoryConcurrency = Math.min(2, categories.length);
    const categoryResults: Array<{
      category: DateCategory;
      places: PlannerPlace[];
      hadSuccess: boolean;
      serverBaseUrl: string | null;
    }> = new Array(categories.length);
    let nextCategoryIndex = 0;

    const workers = Array.from({ length: categoryConcurrency }, async () => {
      while (true) {
        const currentIndex = nextCategoryIndex;
        nextCategoryIndex += 1;

        if (currentIndex >= categories.length) {
          break;
        }

        const category = categories[currentIndex];
        categoryResults[currentIndex] = await fetchPlacesForCategoryFromOverpass(
          category,
          params,
          distanceMeters,
          uniqueOverpassUrls,
          responses,
        );
      }
    });

    await Promise.all(workers);

    for (const result of categoryResults) {
      if (!result) {
        continue;
      }

      if (result.hadSuccess && !firstSuccessfulServerBaseUrl && result.serverBaseUrl) {
        firstSuccessfulServerBaseUrl = result.serverBaseUrl;
      }

      if (result.places.length) {
        const existingPlaces = placesByCategory.get(result.category) || [];
        const dedupedPlaces = dedupePlannerPlacesById([...existingPlaces, ...result.places]).slice(0, MAX_PLACES_RETURNED);
        placesByCategory.set(result.category, dedupedPlaces);
      } else if (result.hadSuccess && !placesByCategory.has(result.category)) {
        placesByCategory.set(result.category, []);
      }

      logOverpassDebug("category completed", {
        category: result.category,
        categoryHadSuccess: result.hadSuccess,
        collectedCount: Array.from(placesByCategory.values()).reduce((total, places) => total + places.length, 0),
        categoryCount: (placesByCategory.get(result.category) || []).length,
      });
    }

    const balancedPlaces = mergePlacesEvenlyByCategory(categories, placesByCategory).slice(0, MAX_PLACES_RETURNED);

    if (balancedPlaces.length) {
      return {
        winner: {
          places: balancedPlaces,
          fromCache: false,
          serverBaseUrl: firstSuccessfulServerBaseUrl || uniqueOverpassUrls[0] || OVERPASS_INTERPRETER_URL,
        },
        responses,
      };
    }

    return {
      winner: null,
      responses,
    };
  } catch (error: any) {
    responses.push({
      serverBaseUrl: OVERPASS_INTERPRETER_URL,
      serverLabel: toSourceLabel(OVERPASS_INTERPRETER_URL),
      ok: false,
      statusCode: null,
      details: error?.message || "network error",
    });

    return {
      winner: null,
      responses,
    };
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

function dedupePlannerPlacesById(places: PlannerPlace[]): PlannerPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}

function mergePlacesEvenlyByCategory(categories: DateCategory[], placesByCategory: Map<DateCategory, PlannerPlace[]>): PlannerPlace[] {
  const buckets = categories.map((category) => [...(placesByCategory.get(category) || [])]);
  const merged: PlannerPlace[] = [];
  const seenIds = new Set<string>();

  while (merged.length < MAX_PLACES_RETURNED) {
    let addedThisPass = false;

    for (const bucket of buckets) {
      while (bucket.length > 0 && seenIds.has(bucket[0].id)) {
        bucket.shift();
      }

      const nextPlace = bucket.shift();
      if (!nextPlace) {
        continue;
      }

      seenIds.add(nextPlace.id);
      merged.push(nextPlace);
      addedThisPass = true;

      if (merged.length >= MAX_PLACES_RETURNED) {
        break;
      }
    }

    if (!addedThisPass) {
      break;
    }
  }

  return merged;
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

    logOverpassDebug("user location status", {
      hasUserLocation: Boolean(params.userLocation),
      userLocation: params.userLocation ?? null,
    });

    logOverpassDebug("fetchIdeas start", {
      selectedDate: params.selectedDate,
      startHour: params.startHour,
      endHour: params.endHour,
      dateLengthMinutes: params.dateLengthMinutes,
      maxPrice: params.maxPrice,
      maxDistance: params.maxDistance,
      categories: params.categories,
      hasUserLocation: Boolean(params.userLocation),
      userLocation: params.userLocation ?? null,
      overpassUrl: OVERPASS_INTERPRETER_URL,
    });

    try {
      if (params.maxDistance <= 0 || !params.userLocation) {
        logOverpassDebug("skipping Overpass because location or distance is missing", {
          maxDistance: params.maxDistance,
          hasUserLocation: Boolean(params.userLocation),
        });
        setMatchedPlaces([]);
        setSourceFile("");
        setServerResponses([]);
      } else {
        const supportedCategories = toSupportedDateCategories(params.categories || []);
        logOverpassDebug("supported categories resolved", {
          requestedCategories: params.categories,
          supportedCategories,
        });

        if (!supportedCategories.length) {
          logOverpassDebug("no supported categories for Overpass; skipping request");
          setMatchedPlaces([]);
          setSourceFile("");
          setServerResponses([]);
          return;
        }

        const serverResult = await fetchPlacesFromOverpass(params);
        logOverpassDebug("overpass fetch completed", {
          hasWinner: Boolean(serverResult.winner),
          responseCount: serverResult.responses.length,
          responses: serverResult.responses,
        });
        setServerResponses(serverResult.responses);

        if (!serverResult.winner) {
          logOverpassDebug("no winner from Overpass", {
            responses: serverResult.responses,
          });
          setError("Could not load places from Overpass API.");
          setMatchedPlaces([]);
          setSourceFile("");
          return;
        }

        logOverpassDebug("raw overpass places", {
          count: serverResult.winner.places.length,
          sample: serverResult.winner.places.slice(0, 5).map((place) => ({
            id: place.id,
            name: place.name,
            type: place.type,
            address: place.address,
            location: place.location,
          })),
        });

        const serverPlaces = serverResult.winner.places.map(toPlaceSummary);
        const dedupedPlaces = dedupePlaceSummariesById(serverPlaces);
        const combinedPlaces = dedupedPlaces.slice(0, MAX_PLACES_RETURNED);
        logOverpassDebug("post-processing places", {
          mappedCount: serverPlaces.length,
          dedupedCount: dedupedPlaces.length,
          returnedCount: combinedPlaces.length,
          maxReturned: MAX_PLACES_RETURNED,
        });
        const placesSourceLabel = toSourceLabel(serverResult.winner.serverBaseUrl);

        setMatchedPlaces(combinedPlaces);
        setSourceFile(placesSourceLabel);
      }
    } catch (fetchError: any) {
      logOverpassDebug("fetchIdeas threw", {
        message: fetchError?.message,
        name: fetchError?.name,
        stack: fetchError?.stack,
      });
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
