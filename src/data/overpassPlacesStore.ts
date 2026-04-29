import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DateCategory } from "src/utils/utils";

export type StoredOverpassPlace = {
  id: string;
  type: string;
  types?: string[];
  address: string;
  location: { latitude?: number; longitude?: number };
  name: string;
};

type StoredOverpassCategorySnapshot = {
  category: DateCategory;
  userLocationKey: string;
  userLocation: { latitude: number; longitude: number };
  serverBaseUrl: string | null;
  savedAt: string;
  places: StoredOverpassPlace[];
};

const OVERPASS_PLACES_STORAGE_KEY = "@overpass_places_cache";
const LOCATION_BUCKET_PRECISION = 3;

let snapshots: StoredOverpassCategorySnapshot[] = [];
let hasInitialized = false;
let initializationPromise: Promise<void> | null = null;

function toLocationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(LOCATION_BUCKET_PRECISION)}:${longitude.toFixed(LOCATION_BUCKET_PRECISION)}`;
}

function clonePlace(place: StoredOverpassPlace): StoredOverpassPlace {
  return {
    ...place,
    location: {
      ...place.location,
    },
  };
}

async function persistSnapshots(nextSnapshots: StoredOverpassCategorySnapshot[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OVERPASS_PLACES_STORAGE_KEY, JSON.stringify(nextSnapshots));
  } catch {
    // Keep the in-memory cache if native storage is unavailable.
  }
}

export async function initializeOverpassPlacesStore(): Promise<void> {
  if (hasInitialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(OVERPASS_PLACES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            snapshots = parsed;
          }
        }
      } catch {
        // Keep empty in-memory defaults when storage is unavailable or corrupted.
      } finally {
        hasInitialized = true;
      }
    })();
  }

  await initializationPromise;
}

export function saveOverpassPlacesSnapshot(snapshot: {
  category: DateCategory;
  userLocation: { latitude: number; longitude: number };
  places: StoredOverpassPlace[];
  serverBaseUrl: string | null;
}): void {
  const nextSnapshot: StoredOverpassCategorySnapshot = {
    category: snapshot.category,
    userLocationKey: toLocationKey(snapshot.userLocation.latitude, snapshot.userLocation.longitude),
    userLocation: {
      latitude: snapshot.userLocation.latitude,
      longitude: snapshot.userLocation.longitude,
    },
    serverBaseUrl: snapshot.serverBaseUrl,
    savedAt: new Date().toISOString(),
    places: snapshot.places.map(clonePlace),
  };

  snapshots = [
    nextSnapshot,
    ...snapshots.filter((entry) => entry.category !== nextSnapshot.category || entry.userLocationKey !== nextSnapshot.userLocationKey),
  ];

  void persistSnapshots(snapshots);
}

function distanceMetersBetweenCoordinates(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function dedupePlacesById(places: StoredOverpassPlace[]): StoredOverpassPlace[] {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}

export function getCachedOverpassPlaces(params: {
  categories: string[];
  maxDistance: number;
  maxPrice: number;
  userLocation?: { latitude: number; longitude: number } | null;
}): StoredOverpassPlace[] {
  if (!params.userLocation || params.maxDistance <= 0) {
    return [];
  }

  const supportedCategories = params.categories.filter((category): category is DateCategory =>
    ["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"].includes(category),
  );
  if (!supportedCategories.length) {
    return [];
  }

  let categories = supportedCategories;
  if (typeof params.maxPrice === "number" && params.maxPrice <= 0) {
    categories = categories.filter((category) => category !== "Food" && category !== "Shopping");
  }

  const targetLocationKey = toLocationKey(params.userLocation.latitude, params.userLocation.longitude);
  const maxDistanceMeters = Math.max(0, Math.round(params.maxDistance * 1609.34));

  const places = snapshots
    .filter((snapshot) => snapshot.userLocationKey === targetLocationKey && categories.includes(snapshot.category))
    .flatMap((snapshot) => snapshot.places)
    .filter((place) => {
      const latitude = place.location.latitude;
      const longitude = place.location.longitude;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return false;
      }

      return distanceMetersBetweenCoordinates(params.userLocation!, { latitude, longitude }) <= maxDistanceMeters;
    });

  return dedupePlacesById(places).map(clonePlace);
}

export function getAllCachedOverpassPlaces(): StoredOverpassPlace[] {
  const places = snapshots.flatMap((snapshot) => snapshot.places);
  return dedupePlacesById(places).map(clonePlace);
}
