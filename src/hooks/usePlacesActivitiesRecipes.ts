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
  Outdoors: [
    "park",
    "hiking_area",
    "campground",
    "nature_preserve",
    "river",
    "lake",
    "scenic_spot",
  ],
  Sports: [
    "gym",
    "sports_club",
    "sports_complex",
    "sports_activity_location",
    "golf_course",
    "tennis_court",
  ],
  Nature: [
    "park",
    "hiking_area",
    "lake",
    "river",
    "nature_preserve",
    "mountain_peak",
    "tourist_attraction",
  ],
  Learning: ["museum", "library", "book_store", "art_gallery"],
  Shopping: [
    "shopping_mall",
    "department_store",
    "clothing_store",
    "gift_shop",
    "toy_store",
    "store",
  ],
  Recreation: [
    "movie_theater",
    "tourist_attraction",
    "video_arcade",
    "amusement_park",
    "playground",
    "bowling_alley",
  ],
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function normalizeHour12(hour12: number, period: string): number {
  const hour = hour12 % 12;
  return period.toUpperCase() === "PM" ? hour + 12 : hour;
}

function isActivityTimeCompatible(
  activity: Activity,
  startHour: number,
  endHour: number,
): boolean {
  if (
    !Array.isArray(activity.bestTimesOfDay) ||
    !activity.bestTimesOfDay.length
  ) {
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

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function loadLocalPlacesData(): PlannerPlace[] {
  try {
    const localJson = require("../data/places/places.json");
    const data = localJson?.default ?? localJson;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
      latitude:
        typeof place.location?.latitude === "number"
          ? place.location.latitude
          : null,
      longitude:
        typeof place.location?.longitude === "number"
          ? place.location.longitude
          : null,
    },
  };
}

function placeMatchesCategories(
  place: PlannerPlace,
  categories: string[],
): boolean {
  const typeSet = new Set(Array.isArray(place.types) ? place.types : []);
  return categories.some((category) => {
    const allowedTypes = CATEGORY_TYPE_MAP[category] || [];
    return allowedTypes.some((type) => typeSet.has(type));
  });
}

const getAvailableAtHomeIdeas = (
  params: PlannedDateResultsParams,
): {
  recipes: Recipe[];
  activities: Activity[];
} => {
  const budget =
    typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)
      ? params.maxPrice
      : Number.POSITIVE_INFINITY;

  const totalMinutes = computeWindowDurationMinutes(
    params.startHour,
    params.endHour,
  );

  const parsedDate = new Date(`${toIsoDate(params.selectedDate)}T12:00:00`);
  const monthName = MONTHS[parsedDate.getMonth()] || "";
  const weekdayName = DAYS[parsedDate.getDay()] || "";

  const affordableRecipes = recipes.filter(
    (recipe) =>
      params.categories.includes("Food") &&
      recipe.estimatedPrice <= budget &&
      recipe.estimatedTime <= totalMinutes,
  );

  const affordableActivities = activities
    .filter((activity) => activity.cost <= budget)
    .filter((activity) =>
      activity.categories.some((category) =>
        params.categories.includes(category as DateCategory),
      ),
    )
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
    .filter((activity) =>
      isActivityTimeCompatible(activity, params.startHour, params.endHour),
    );

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
  const [sourceFile, setSourceFile] = useState("src/data/places/places.json");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const atHomeOptions = useMemo(
    () => getAvailableAtHomeIdeas(params),
    [params],
  );

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (params.maxDistance <= 0) {
        setMatchedPlaces([]);
        setSourceFile("");
      } else {
        const localPlaces = loadLocalPlacesData();
        const filteredLocalPlaces = localPlaces
          .filter((place) => placeMatchesCategories(place, params.categories))
          .filter((place) => {
            if (!params.userLocation) {
              return true;
            }

            const latitude = place.location?.latitude;
            const longitude = place.location?.longitude;
            if (typeof latitude !== "number" || typeof longitude !== "number") {
              return true;
            }

            const milesAway = haversineMiles(
              params.userLocation.latitude,
              params.userLocation.longitude,
              latitude,
              longitude,
            );

            return milesAway <= params.maxDistance;
          })
          .map(toPlaceSummary);

        setMatchedPlaces(filteredLocalPlaces);
        setSourceFile("src/data/places/places.json");
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

export { useDatePlannerIdeas };
