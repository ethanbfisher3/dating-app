import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import activities, { Activity } from "../data/activities";
import recipes, { Recipe } from "../data/Recipes";
import type { DateCategory } from "src/utils/utils";
import createOverpassQuery from "../data/overpass/overpass";
import {
  getCachedOverpassPlaces,
  initializeOverpassPlacesStore,
  saveOverpassPlacesSnapshot,
  type StoredOverpassPlace,
} from "../data/overpassPlacesStore";

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

const MAX_PLACES_RETURNED = 100;
const METERS_PER_MILE = 1609.34;
const OVERPASS_QUERY_MAX_RADIUS_METERS = Math.round(25 * METERS_PER_MILE);
const OVERPASS_INTERPRETER_URL = process.env.EXPO_PUBLIC_OVERPASS_INTERPRETER_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_FALLBACK_URLS = [
  "https://overpass.private.coffee/api/interpreter",
  OVERPASS_INTERPRETER_URL,
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_REQUEST_TIMEOUT_MS = 12000;
const PLANNER_SOFT_TIMEOUT_MS = 1800;
const OVERPASS_PROGRESSIVE_RADII_METERS = [1000, 1 * METERS_PER_MILE, 5 * METERS_PER_MILE, 10 * METERS_PER_MILE, 25 * METERS_PER_MILE].map((radius) =>
  Math.round(radius),
);
const OVERPASS_CATEGORY_TARGET_COUNT = 10;
const SUPPORTED_DATE_CATEGORIES = new Set<DateCategory>(["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"]);
type PlannerIdeasFetchResult = {
  winner: {
    places: PlannerPlace[];
    fromCache: boolean;
    serverBaseUrl: string;
  } | null;
  responses: PlacesServerResponse[];
};

const plannerIdeasFetchCache = new Map<string, PlannerIdeasFetchResult>();
const plannerIdeasFetchInflight = new Map<string, Promise<PlannerIdeasFetchResult>>();
type CachedCategoryFetchResult = {
  places: PlannerPlace[];
  hadSuccess: boolean;
  serverBaseUrl: string | null;
  responses: PlacesServerResponse[];
};

const categoryFetchCache = new Map<string, CachedCategoryFetchResult>();

function getPlannerIdeasCacheKey(params: PlannedDateResultsParams): string {
  return JSON.stringify({
    categories: params.categories || [],
    endHour: params.endHour,
    location: params.userLocation
      ? {
          latitude: params.userLocation.latitude,
          longitude: params.userLocation.longitude,
        }
      : null,
    maxDistance: params.maxDistance,
    maxPrice: params.maxPrice,
    selectedDate: params.selectedDate,
    startHour: params.startHour,
  });
}

function getCategoryLocationCacheKey(category: DateCategory, userLocation: PlannedDateResultsParams["userLocation"]): string | null {
  if (!userLocation) {
    return null;
  }

  return [category, userLocation.latitude.toFixed(5), userLocation.longitude.toFixed(5)].join(":");
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceMetersBetweenCoordinates(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function filterPlacesWithinRadius(
  places: PlannerPlace[],
  userLocation: PlannedDateResultsParams["userLocation"],
  distanceMeters: number,
): PlannerPlace[] {
  if (!userLocation) {
    return places;
  }

  return places.filter((place) => {
    const latitude = place.location.latitude;
    const longitude = place.location.longitude;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return false;
    }

    return distanceMetersBetweenCoordinates(userLocation, { latitude, longitude }) <= distanceMeters;
  });
}

function cacheCategoryFetchResult(
  category: DateCategory,
  params: PlannedDateResultsParams,
  result: CachedCategoryFetchResult,
): void {
  const cacheKey = getCategoryLocationCacheKey(category, params.userLocation);
  if (!cacheKey) {
    return;
  }

  categoryFetchCache.set(cacheKey, result);
}

function getCachedCategoryFetchResult(
  category: DateCategory,
  params: PlannedDateResultsParams,
  distanceMeters: number,
): CachedCategoryFetchResult | null {
  const cacheKey = getCategoryLocationCacheKey(category, params.userLocation);
  if (!cacheKey) {
    return null;
  }

  const cachedResult = categoryFetchCache.get(cacheKey);
  if (!cachedResult) {
    return null;
  }

  return {
    ...cachedResult,
    places: filterPlacesWithinRadius(cachedResult.places, params.userLocation, distanceMeters),
    responses: cachedResult.responses.map((response) => ({ ...response })),
  };
}

function cloneCategoryFetchResult(result: CachedCategoryFetchResult): CachedCategoryFetchResult {
  return {
    hadSuccess: result.hadSuccess,
    places: [...result.places],
    responses: result.responses.map((response) => ({ ...response })),
    serverBaseUrl: result.serverBaseUrl,
  };
}

function getCategoryCacheAtRadius(
  category: DateCategory,
  params: PlannedDateResultsParams,
  radiusMeters: number,
): CachedCategoryFetchResult | null {
  const cachedResult = getCachedCategoryFetchResult(category, params, radiusMeters);
  if (!cachedResult) {
    return null;
  }

  return cloneCategoryFetchResult(cachedResult);
}

function toStoredOverpassPlace(place: PlannerPlace): StoredOverpassPlace {
  return {
    id: place.id,
    type: place.type,
    address: place.address,
    location: {
      latitude: place.location.latitude,
      longitude: place.location.longitude,
    },
    name: place.name,
  };
}

export function fetchPlacesFromOverpassWithCache(params: PlannedDateResultsParams): Promise<PlannerIdeasFetchResult> {
  const cacheKey = getPlannerIdeasCacheKey(params);
  const cachedResult = plannerIdeasFetchCache.get(cacheKey);
  if (cachedResult) {
    return Promise.resolve(cachedResult);
  }

  const inflightRequest = plannerIdeasFetchInflight.get(cacheKey);
  if (inflightRequest) {
    return inflightRequest;
  }

  const request = fetchPlacesFromOverpass(params)
    .then((result) => {
      if (result.winner) {
        plannerIdeasFetchCache.set(cacheKey, result);
      }

      return result;
    })
    .finally(() => {
      plannerIdeasFetchInflight.delete(cacheKey);
    });

  plannerIdeasFetchInflight.set(cacheKey, request);
  return request;
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

function shufflePlaces<T>(places: T[]): T[] {
  const shuffled = [...places];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
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
  const queryCenter = params.userLocation;
  const progressiveRadii = OVERPASS_PROGRESSIVE_RADII_METERS.filter((radius) => radius <= OVERPASS_QUERY_MAX_RADIUS_METERS);

  let finalPlaces: PlannerPlace[] = [];
  let hadSuccess = false;
  let finalServerBaseUrl: string | null = null;

  for (const queryRadiusMeters of progressiveRadii) {
    const cachedResult = getCategoryCacheAtRadius(category, params, queryRadiusMeters);
    if (cachedResult) {
      responses.push(...cachedResult.responses.map((response) => ({ ...response })));
      finalPlaces = cachedResult.places;
      hadSuccess = hadSuccess || cachedResult.hadSuccess;
      finalServerBaseUrl = cachedResult.serverBaseUrl || finalServerBaseUrl;

      if (finalPlaces.length >= OVERPASS_CATEGORY_TARGET_COUNT) {
        break;
      }

      continue;
    }

    const fetchedResult = await fetchPlacesForCategoryAtRadiusFromOverpass(
      category,
      params,
      queryCenter,
      queryRadiusMeters,
      uniqueOverpassUrls,
      responses,
    );

    if (fetchedResult) {
      finalPlaces = fetchedResult.places;
      hadSuccess = true;
      finalServerBaseUrl = fetchedResult.serverBaseUrl || finalServerBaseUrl;

      if (finalPlaces.length >= OVERPASS_CATEGORY_TARGET_COUNT) {
        break;
      }
    }
  }

  return {
    category,
    places: finalPlaces,
    hadSuccess,
    serverBaseUrl: finalServerBaseUrl,
  };
}

async function fetchPlacesForCategoryAtRadiusFromOverpass(
  category: DateCategory,
  params: PlannedDateResultsParams,
  queryCenter: { latitude: number; longitude: number },
  queryRadiusMeters: number,
  uniqueOverpassUrls: string[],
  responses: PlacesServerResponse[],
): Promise<CachedCategoryFetchResult | null> {
  const query = createOverpassQuery(
    [category],
    {
      lat: queryCenter.latitude,
      lon: queryCenter.longitude,
    },
    queryRadiusMeters,
  );

  const requestAttempts: Array<{
    label: string;
    contentType: string;
    body: string;
    method: "POST" | "GET";
    toRequestUrl: (baseUrl: string) => string;
  }> = [
    {
      label: "get-query-param",
      method: "GET",
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      body: "",
      toRequestUrl: (baseUrl: string) => `${baseUrl}?data=${encodeURIComponent(query)}`,
    },
    {
      label: "post-form-encoded",
      method: "POST",
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      body: `data=${encodeURIComponent(query)}`,
      toRequestUrl: (baseUrl: string) => baseUrl,
    },
  ];

  for (const serverBaseUrl of uniqueOverpassUrls) {
    for (const attempt of requestAttempts) {
      const requestUrl = attempt.toRequestUrl(serverBaseUrl);
      const attemptController = new AbortController();
      const attemptTimeoutId = setTimeout(() => attemptController.abort(), OVERPASS_REQUEST_TIMEOUT_MS);
      const attemptStart = Date.now();

      const result = await fetch(requestUrl, {
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
              details: `[${category}][${queryRadiusMeters}m][${attempt.label}] ${details || "request failed"}`,
            });
            return null;
          }

          const payload = (await response.json()) as OverpassResponse;
          const elements = payload.elements || [];

          const places = dedupePlannerPlacesById(
            elements.map(toPlannerPlaceFromOverpassElement).filter((place): place is PlannerPlace => Boolean(place)),
          ).slice(0, MAX_PLACES_RETURNED);

          cacheCategoryFetchResult(category, params, {
            hadSuccess: true,
            places: [...places],
            responses: [
              {
                serverBaseUrl,
                serverLabel: toSourceLabel(serverBaseUrl),
                ok: true,
                statusCode: response.status,
                details: `[${category}][${queryRadiusMeters}m][${attempt.label}] OK (${places.length} places) (${elapsedMs}ms)`,
              },
            ],
            serverBaseUrl,
          });

          saveOverpassPlacesSnapshot({
            category,
            userLocation: {
              latitude: queryCenter.latitude,
              longitude: queryCenter.longitude,
            },
            places: places.map(toStoredOverpassPlace),
            serverBaseUrl,
          });

          responses.push({
            serverBaseUrl,
            serverLabel: toSourceLabel(serverBaseUrl),
            ok: true,
            statusCode: response.status,
            details: `[${category}][${queryRadiusMeters}m][${attempt.label}] OK (${places.length} places) (${elapsedMs}ms)`,
          });

          return {
            hadSuccess: true,
            places,
            responses: [
              {
                serverBaseUrl,
                serverLabel: toSourceLabel(serverBaseUrl),
                ok: true,
                statusCode: response.status,
                details: `[${category}][${queryRadiusMeters}m][${attempt.label}] OK (${places.length} places) (${elapsedMs}ms)`,
              },
            ],
            serverBaseUrl,
          };
        })
        .catch(async (error: any) => {
          const elapsedMs = Date.now() - attemptStart;
          if (error?.name === "AbortError") {
            responses.push({
              serverBaseUrl,
              serverLabel: toSourceLabel(serverBaseUrl),
              ok: false,
              statusCode: null,
              details: `[${category}][${queryRadiusMeters}m][${attempt.label}] timeout after ${OVERPASS_REQUEST_TIMEOUT_MS}ms`,
            });
            return null;
          }

          responses.push({
            serverBaseUrl,
            serverLabel: toSourceLabel(serverBaseUrl),
            ok: false,
            statusCode: null,
            details: `[${category}][${queryRadiusMeters}m][${attempt.label}] ${error?.message || "network error"}`,
          });

          return null;
        })
        .finally(() => {
          clearTimeout(attemptTimeoutId);
        });

      if (result) {
        return result;
      }
    }
  }

  return null;
}

async function fetchPlacesFromOverpass(params: PlannedDateResultsParams): Promise<PlannerIdeasFetchResult> {
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
    categories = categories.filter((category) => category !== "Food" && category !== "Shopping");
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
        const distanceMeters = Math.max(0, Math.round(params.maxDistance * METERS_PER_MILE));
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
    }

    const balancedPlaces = mergePlacesEvenlyByCategory(categories, placesByCategory);
    const finalPlaces = shufflePlaces(balancedPlaces).slice(0, MAX_PLACES_RETURNED);

    if (finalPlaces.length) {
      return {
        winner: {
          places: finalPlaces,
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
  const fetchVersionRef = useRef(0);

  const atHomeOptions = useMemo(() => getAvailableAtHomeIdeas(params), [params]);

  useEffect(() => {
    let cancelled = false;

    void initializeOverpassPlacesStore().then(() => {
      if (cancelled) {
        return;
      }

      const cachedPlaces = getCachedOverpassPlaces(params).map(toPlaceSummary);
      if (cachedPlaces.length) {
        setMatchedPlaces(cachedPlaces);
        setSourceFile("Cached Overpass Places");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const fetchIdeas = useCallback(() => {
    const fetchVersion = fetchVersionRef.current + 1;
    fetchVersionRef.current = fetchVersion;

    const planningStartMs = Date.now();
    setIsLoading(true);
    setError(null);

    const applyIfCurrent = (apply: () => void) => {
      if (fetchVersionRef.current !== fetchVersion) {
        return;
      }

      apply();
    };

    const releaseLoadingState = () => {
      applyIfCurrent(() => {
        setIsLoading(false);
      });
    };

    const cachedPlaces = getCachedOverpassPlaces(params).map(toPlaceSummary);
    if (cachedPlaces.length) {
      setMatchedPlaces(cachedPlaces);
      setSourceFile("Cached Overpass Places");
    }

    if (params.maxDistance <= 0 || !params.userLocation) {
      setMatchedPlaces([]);
      setSourceFile("");
      setServerResponses([]);
      setIsLoading(false);
      return;
    }

    const supportedCategories = toSupportedDateCategories(params.categories || []);
    if (!supportedCategories.length) {
      setMatchedPlaces([]);
      setSourceFile("");
      setServerResponses([]);
      setIsLoading(false);
      return;
    }

    const softTimeoutId = setTimeout(() => {
      releaseLoadingState();
    }, PLANNER_SOFT_TIMEOUT_MS);

    void fetchPlacesFromOverpassWithCache(params)
      .then((serverResult) => {
        applyIfCurrent(() => {
          setServerResponses(serverResult.responses);

          if (!serverResult.winner) {
            setError("Could not load places from Overpass API.");
            setMatchedPlaces([]);
            setSourceFile("");
            return;
          }

          const serverPlaces = serverResult.winner.places.map(toPlaceSummary);
          const dedupedPlaces = dedupePlaceSummariesById(serverPlaces);
          const combinedPlaces = dedupedPlaces.slice(0, MAX_PLACES_RETURNED);
          const placesSourceLabel = toSourceLabel(serverResult.winner.serverBaseUrl);

          setMatchedPlaces(combinedPlaces);
          setSourceFile(placesSourceLabel);
        });
      })
      .catch((fetchError: any) => {
        applyIfCurrent(() => {
          setError(fetchError?.message || "Failed to fetch date planner ideas.");
          setMatchedPlaces([]);
          setSourceFile("");
          setServerResponses([]);
        });
      })
      .finally(() => {
        clearTimeout(softTimeoutId);
        releaseLoadingState();
      });
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
