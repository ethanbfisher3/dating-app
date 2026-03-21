import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export type GenerateDatePlannerIdeasRequest = {
  categories: string[];
  date: string;
  startHour: number;
  endHour: number;
  ideaCount: number;
  maxPrice?: number;
  maxDistanceMiles?: number;
  userLatitude?: number;
  userLongitude?: number;
};

type PlannerPlace = {
  id: string;
  types?: string[];
  formattedAddress?: string;
  googleMapsUri?: string;
  rating?: number;
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
  ],
  Outdoors: [
    "park",
    "hiking_area",
    "campground",
    "nature_preserve",
    "river",
    "lake",
  ],
  Sports: [
    "gym",
    "sports_club",
    "sports_complex",
    "sports_activity_location",
    "golf_course",
  ],
  Nature: [
    "park",
    "hiking_area",
    "lake",
    "river",
    "nature_preserve",
    "tourist_attraction",
  ],
  Learning: ["museum", "library", "book_store", "art_gallery"],
  Shopping: [
    "shopping_mall",
    "department_store",
    "clothing_store",
    "gift_shop",
    "store",
  ],
  Recreation: [
    "movie_theater",
    "tourist_attraction",
    "video_arcade",
    "amusement_park",
    "playground",
  ],
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getLatestPlacesFilePath() {
  const dataDir = path.join(__dirname, "data");
  const files = await fs.readdir(dataDir);
  const matches = files
    .filter((file) => /^places_\d{4}-\d{2}-\d{2}(?:_\d+)?\.json$/.test(file))
    .sort((a, b) => a.localeCompare(b));

  if (!matches.length) {
    throw new Error("No places data files found in server/data.");
  }

  return path.join(dataDir, matches[matches.length - 1]);
}

export async function getDatePlannerIdeas(
  params: GenerateDatePlannerIdeasRequest,
) {
  const filePath = await getLatestPlacesFilePath();
  const raw = await fs.readFile(filePath, "utf8");
  const places: PlannerPlace[] = JSON.parse(raw);

  const matchedPlaces = places
    .filter((place) => {
      const placeTypes = new Set(Array.isArray(place.types) ? place.types : []);
      return params.categories.some((category) => {
        const categoryTypes = CATEGORY_TYPE_MAP[category] || [];
        return categoryTypes.some((type) => placeTypes.has(type));
      });
    })
    .filter((place) => {
      if (
        typeof params.userLatitude !== "number" ||
        typeof params.userLongitude !== "number" ||
        typeof params.maxDistanceMiles !== "number"
      ) {
        return true;
      }

      const latitude = place.location?.latitude;
      const longitude = place.location?.longitude;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return true;
      }

      const toRadians = (value: number) => (value * Math.PI) / 180;
      const dLat = toRadians(latitude - params.userLatitude);
      const dLng = toRadians(longitude - params.userLongitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(params.userLatitude)) *
          Math.cos(toRadians(latitude)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const miles = 3958.8 * c;
      return miles <= params.maxDistanceMiles;
    })
    .map((place) => ({
      id: place.id,
      name: place.displayName?.text || "Unknown place",
      address: place.formattedAddress || "",
      types: Array.isArray(place.types) ? place.types : [],
      googleMapsUri: place.googleMapsUri || "",
      rating: typeof place.rating === "number" ? place.rating : null,
      sourceKind: "place",
      location: {
        latitude:
          typeof place.location?.latitude === "number"
            ? place.location.latitude
            : null,
        longitude:
          typeof place.location?.longitude === "number"
            ? place.location.longitude
            : null,
      },
    }));

  return {
    sourceFile: path.basename(filePath),
    totalMatches: matchedPlaces.length,
    matchedPlaces,
    ideas: [],
  };
}
