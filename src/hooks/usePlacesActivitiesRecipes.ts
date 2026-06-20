import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlannedDateResultsParams } from "../types/navigation";
import activities, { Activity } from "../data/activities";
import recipes, { Recipe } from "../data/Recipes";
import type { DateCategory } from "src/utils/utils";
import { createQueryForSlots } from "../data/overpass/overpass";
import { getRequiredPlaceSlots } from "../data/datePlannerTemplates";

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

export type OverpassQueryAttempt = {
  query: string;
  radiusMeters: number;
  elapsedMs: number;
  placesFound: number;
  succeeded: boolean;
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
  types?: string[];
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
const MAX_OVERPASS_RADIUS_METERS = 2000;
const CACHE_LOCATION_TOLERANCE_METERS = 400;
const OVERPASS_INTERPRETER_URL = process.env.EXPO_PUBLIC_OVERPASS_INTERPRETER_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_FALLBACK_URLS = [
  "https://overpass.private.coffee/api/interpreter",
  OVERPASS_INTERPRETER_URL,
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_REQUEST_TIMEOUT_MS = 30000;
const SUPPORTED_DATE_CATEGORIES = new Set<DateCategory>(["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"]);
type PlannerIdeasFetchResult = {
  winner: {
    places: PlannerPlace[];
    fromCache: boolean;
    serverBaseUrl: string;
  } | null;
  responses: PlacesServerResponse[];
};

type PlaceCache = {
  places: PlannerPlace[];
  locationLat: number;
  locationLon: number;
  distanceMeters: number;
  slotsKey: string;
};

// Module-level so the cache survives navigation away and back to the results screen.
// Used as a fallback when Overpass is unreachable or times out.
let _placeCache: PlaceCache | null = null;

function isCacheCompatible(
  cache: PlaceCache,
  userCenter: { lat: number; lon: number },
  distanceMeters: number,
  slotsKey: string,
): boolean {
  if (cache.distanceMeters !== distanceMeters) return false;
  if (cache.slotsKey !== slotsKey) return false;
  return (
    distanceMetersBetweenCoordinates(
      { latitude: cache.locationLat, longitude: cache.locationLon },
      { latitude: userCenter.lat, longitude: userCenter.lon },
    ) <= CACHE_LOCATION_TOLERANCE_METERS
  );
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


function toSourceLabel(baseUrl: string): string {
  if (baseUrl === "cache") return "Cache";
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

function toPlaceTypesFromTags(tags: Record<string, string>): string[] {
  const types = new Set<string>();

  if (tags.amenity) {
    types.add("amenity");
    types.add(tags.amenity);
  }

  if (tags.leisure) {
    types.add("leisure");
    types.add(tags.leisure);
  }

  if (tags.shop) {
    types.add("shop");
    types.add(tags.shop);
  }

  if (tags.sport) {
    types.add("sport");
    types.add(tags.sport);
  }

  if (tags.tourism) {
    types.add("tourism");
    types.add(tags.tourism);
  }

  if (tags.historic) {
    types.add("historic");
    types.add(tags.historic);
  }

  if (tags.natural) {
    types.add("natural");
    types.add(tags.natural);
  }

  if (tags.highway) {
    types.add("highway");
    types.add(tags.highway);
  }

  return [...types];
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
    types: toPlaceTypesFromTags(element.tags),
    address,
    location: {
      latitude: coordinate.lat,
      longitude: coordinate.lon,
    },
  };
}

function offsetCoordinates(
  center: { lat: number; lon: number },
  distanceMeters: number,
  bearingDegrees: number,
): { lat: number; lon: number } {
  const R = 6371000;
  const lat1 = (center.lat * Math.PI) / 180;
  const lon1 = (center.lon * Math.PI) / 180;
  const b = (bearingDegrees * Math.PI) / 180;
  const d = distanceMeters / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b));
  const lon2 = lon1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lon: (lon2 * 180) / Math.PI };
}

function buildSearchCenters(
  userCenter: { lat: number; lon: number },
  maxDistanceMeters: number,
): Array<{ lat: number; lon: number }> {
  const maxOffset = maxDistanceMeters - MAX_OVERPASS_RADIUS_METERS;
  // If the user's area fits within one search circle, we have no choice but to
  // use their exact location.
  if (maxOffset <= 0) return [userCenter];
  // Otherwise pick random center points within the searchable area each time so
  // the same location doesn't always surface the same places.
  return Array.from({ length: 5 }, () =>
    offsetCoordinates(userCenter, Math.random() * maxOffset, Math.random() * 360),
  );
}

async function fetchPlacesFromOverpass(params: PlannedDateResultsParams, bypassCache = false, onStatus?: (s: string) => void, onQueryAttempt?: (attempt: OverpassQueryAttempt) => void): Promise<PlannerIdeasFetchResult> {
  const responses: PlacesServerResponse[] = [];
  const uniqueOverpassUrls = Array.from(new Set(OVERPASS_FALLBACK_URLS.filter(Boolean)));
  const fallbackUrl = uniqueOverpassUrls[0] || OVERPASS_INTERPRETER_URL;

  if (!params.userLocation || params.maxDistance <= 0) {
    return { winner: { places: [], fromCache: false, serverBaseUrl: fallbackUrl }, responses };
  }

  // Step 1: determine which slot types the selected templates actually need
  let neededSlots = getRequiredPlaceSlots(params);

  // Filter food/shopping slots if budget is $0
  if (typeof params.maxPrice === "number" && params.maxPrice <= 0) {
    const excluded = new Set(["restaurant", "fast_food", "cafe", "ice_cream", "food_court", "mall", "clothes", "books", "gift", "toys", "electronics"]);
    neededSlots = neededSlots.filter((s) => !excluded.has(s));
  }

  if (!neededSlots.length) {
    return { winner: { places: [], fromCache: false, serverBaseUrl: fallbackUrl }, responses };
  }

  const distanceMeters = Math.max(0, Math.round(params.maxDistance * METERS_PER_MILE));
  const userCenter = { lat: params.userLocation.latitude, lon: params.userLocation.longitude };
  const slotsKey = [...neededSlots].sort().join(",");

  // Fire all search-center queries in parallel. Collect places as results arrive;
  // once we have enough, abort any still-pending queries.
  const searchRadius = Math.min(distanceMeters, MAX_OVERPASS_RADIUS_METERS);
  const searchCenters = buildSearchCenters(userCenter, distanceMeters);
  const resultLimit = neededSlots.length + 10;
  const controllers = searchCenters.map(() => new AbortController());
  const accumulatedPlaces: PlannerPlace[] = [];
  let winnerBaseUrl = fallbackUrl;
  let anySucceeded = false;
  let completedCount = 0;

  onStatus?.(`Calling Overpass API (${searchCenters.length} queries in parallel)...`);

  await Promise.allSettled(
    searchCenters.map(async (center, i) => {
      const query = createQueryForSlots(neededSlots, center, searchRadius, resultLimit);
      if (!query) return;
      const start = Date.now();
      const attempt = await runOverpassQuery(query, searchRadius, uniqueOverpassUrls, responses, controllers[i].signal);
      const elapsed = Date.now() - start;
      const aborted = controllers[i].signal.aborted;
      completedCount++;
      onQueryAttempt?.({
        query,
        radiusMeters: searchRadius,
        elapsedMs: elapsed,
        placesFound: attempt?.places.length ?? 0,
        succeeded: attempt !== null && !aborted,
      });
      if (!attempt || aborted) {
        onStatus?.(`${completedCount}/${searchCenters.length} done, ${accumulatedPlaces.length} places so far...`);
        return;
      }
      anySucceeded = true;
      if (winnerBaseUrl === fallbackUrl) winnerBaseUrl = attempt.serverBaseUrl;
      for (const place of attempt.places) accumulatedPlaces.push(place);
      onStatus?.(`${completedCount}/${searchCenters.length} done, ${accumulatedPlaces.length} places found...`);
      if (accumulatedPlaces.length >= resultLimit) {
        controllers.forEach((c, j) => { if (j !== i) c.abort(); });
      }
    }),
  );

  const result = anySucceeded ? { places: accumulatedPlaces, serverBaseUrl: winnerBaseUrl } : null;
  const rawPlaces = result?.places ?? [];
  if (rawPlaces.length > 0) onStatus?.(`Processing ${rawPlaces.length} place${rawPlaces.length === 1 ? "" : "s"}...`);

  if (rawPlaces.length > 0) {
    const validPlaces = dedupePlannerPlacesById(rawPlaces).filter(
      (p) =>
        distanceMetersBetweenCoordinates(
          { latitude: userCenter.lat, longitude: userCenter.lon },
          p.location as { latitude: number; longitude: number },
        ) <= distanceMeters,
    );

    if (validPlaces.length > 0) {
      // Save the full pool so the fallback cache stays up to date.
      _placeCache = {
        places: validPlaces,
        locationLat: userCenter.lat,
        locationLon: userCenter.lon,
        distanceMeters,
        slotsKey,
      };

      return {
        winner: {
          places: shufflePlaces(validPlaces).slice(0, MAX_PLACES_RETURNED),
          fromCache: false,
          serverBaseUrl: result!.serverBaseUrl,
        },
        responses,
      };
    }
  }

  // Overpass failed or returned nothing — serve from cache if we have compatible data.
  // No TTL check here: stale data is better than nothing when the network is down.
  if (!bypassCache && _placeCache && isCacheCompatible(_placeCache, userCenter, distanceMeters, slotsKey)) {
    onStatus?.("Loading from cache...");
    return {
      winner: {
        places: shufflePlaces([..._placeCache.places]).slice(0, MAX_PLACES_RETURNED),
        fromCache: true,
        serverBaseUrl: "cache",
      },
      responses,
    };
  }

  return { winner: null, responses };
}

async function runOverpassQuery(
  query: string,
  radiusMeters: number,
  uniqueOverpassUrls: string[],
  responses: PlacesServerResponse[],
  externalSignal?: AbortSignal,
): Promise<{ places: PlannerPlace[]; serverBaseUrl: string } | null> {
  if (!uniqueOverpassUrls.length) return null;
  if (externalSignal?.aborted) return null;

  const encodedBody = `data=${encodeURIComponent(query)}`;

  return new Promise((resolve) => {
    let settled = false;
    let failCount = 0;
    const total = uniqueOverpassUrls.length;
    const internalControllers: AbortController[] = [];

    const onSuccess = (result: { places: PlannerPlace[]; serverBaseUrl: string }) => {
      if (!settled) { settled = true; resolve(result); }
    };

    const onFailure = () => {
      failCount += 1;
      if (!settled && failCount >= total) { settled = true; resolve(null); }
    };

    // When the caller cancels this query, abort all in-flight mirror fetches immediately.
    externalSignal?.addEventListener("abort", () => {
      if (!settled) {
        settled = true;
        for (const c of internalControllers) c.abort();
        resolve(null);
      }
    }, { once: true });

    for (const serverBaseUrl of uniqueOverpassUrls) {
      const controller = new AbortController();
      internalControllers.push(controller);
      const attemptStart = Date.now();
      const timeoutId = setTimeout(() => controller.abort(), OVERPASS_REQUEST_TIMEOUT_MS);

      fetch(serverBaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Accept: "application/json, text/plain, */*" },
        signal: controller.signal,
        body: encodedBody,
      })
        .then(async (response) => {
          clearTimeout(timeoutId);
          if (settled) return; // already resolved by external abort or a faster mirror
          const elapsed = Date.now() - attemptStart;
          if (!response.ok) {
            const details = await response.text();
            responses.push({ serverBaseUrl, serverLabel: toSourceLabel(serverBaseUrl), ok: false, statusCode: response.status, details: `[${radiusMeters}m] ${details || "request failed"}` });
            onFailure();
            return;
          }
          const payload = (await response.json()) as OverpassResponse;
          const places = dedupePlannerPlacesById(
            (payload.elements || []).map(toPlannerPlaceFromOverpassElement).filter((p): p is PlannerPlace => Boolean(p)),
          );
          responses.push({ serverBaseUrl, serverLabel: toSourceLabel(serverBaseUrl), ok: true, statusCode: response.status, details: `[${radiusMeters}m] OK (${places.length} places) (${elapsed}ms)` });
          onSuccess({ places, serverBaseUrl });
        })
        .catch((err: any) => {
          clearTimeout(timeoutId);
          const elapsed = Date.now() - attemptStart;
          responses.push({
            serverBaseUrl,
            serverLabel: toSourceLabel(serverBaseUrl),
            ok: false,
            statusCode: null,
            details: err?.name === "AbortError"
              ? `[${radiusMeters}m] cancelled or timed out (${elapsed}ms)`
              : `[${radiusMeters}m] ${err?.message || "network error"} (${elapsed}ms)`,
          });
          onFailure();
        });
    }
  });
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

export default function useDatePlannerIdeas(params: PlannedDateResultsParams, onStatus?: (status: string) => void): {
  places: PlaceSummary[];
  cachedPlaces: PlaceSummary[];
  allCachedPlaces: PlaceSummary[];
  recipes: Recipe[];
  activities: Activity[];
  sourceFile: string;
  isLoading: boolean;
  error: string | null;
  serverResponses: PlacesServerResponse[];
  queryAttempts: OverpassQueryAttempt[];
  refetch: (options?: { bypassCache?: boolean }) => void;
} {
  const [matchedPlaces, setMatchedPlaces] = useState<PlaceSummary[]>([]);
  const [sourceFile, setSourceFile] = useState("Overpass API");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverResponses, setServerResponses] = useState<PlacesServerResponse[]>([]);
  const [queryAttempts, setQueryAttempts] = useState<OverpassQueryAttempt[]>([]);
  const queryAttemptsRef = useRef<OverpassQueryAttempt[]>([]);
  const fetchVersionRef = useRef(0);

  const atHomeOptions = useMemo(() => getAvailableAtHomeIdeas(params), [params]);

  const fetchIdeas = useCallback((_options?: { bypassCache?: boolean }) => {
    const fetchVersion = fetchVersionRef.current + 1;
    fetchVersionRef.current = fetchVersion;

    setIsLoading(true);
    setError(null);

    const applyIfCurrent = (apply: () => void) => {
      if (fetchVersionRef.current !== fetchVersion) {
        return;
      }
      apply();
    };

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

    const bypassCache = _options?.bypassCache ?? false;

    // Hard timeout in case AbortController is unreliable on this RN version.
    const hardTimeoutId = setTimeout(() => {
      applyIfCurrent(() => {
        setError("Request timed out. Check your connection and try again.");
        setMatchedPlaces([]);
        setSourceFile("");
        setIsLoading(false);
      });
    }, 90000);

    queryAttemptsRef.current = [];
    setQueryAttempts([]);
    onStatus?.("Analyzing preferences...");
    void fetchPlacesFromOverpass(params, bypassCache, onStatus, (attempt) => {
      queryAttemptsRef.current = [...queryAttemptsRef.current, attempt];
      setQueryAttempts(queryAttemptsRef.current);
    })
      .then((serverResult) => {
        applyIfCurrent(() => {
          setServerResponses(serverResult.responses);

          if (!serverResult.winner || !serverResult.winner.places.length) {
            setError("Could not load places from Overpass API.");
            setMatchedPlaces([]);
            setSourceFile("");
            return;
          }

          const serverPlaces = serverResult.winner.places.map(toPlaceSummary);
          const dedupedPlaces = dedupePlaceSummariesById(serverPlaces);
          const combinedPlaces = dedupedPlaces.slice(0, MAX_PLACES_RETURNED);

          setMatchedPlaces(combinedPlaces);
          setSourceFile(toSourceLabel(serverResult.winner.serverBaseUrl));
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
        clearTimeout(hardTimeoutId);
        applyIfCurrent(() => setIsLoading(false));
      });
  }, [params]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return {
    places: matchedPlaces,
    cachedPlaces: [],
    allCachedPlaces: [],
    recipes: atHomeOptions.recipes,
    activities: atHomeOptions.activities,
    sourceFile,
    isLoading,
    error,
    serverResponses,
    queryAttempts,
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
