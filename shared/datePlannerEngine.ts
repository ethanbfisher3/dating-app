export type PlannerPlace = {
  id: string;
  types?: string[];
  formattedAddress?: string;
  googleMapsUri?: string;
  rating?: number;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
  businessStatus?: string;
  displayName?: { text?: string };
  regularOpeningHours?: {
    periods?: Array<{
      open?: { day?: number; hour?: number; minute?: number };
      close?: { day?: number; hour?: number; minute?: number };
    }>;
  };
  sourceKind?: "place" | "activity";
  activeMonths?: string[];
  activityMinDurationMinutes?: number;
};

export type PlannerActivityInput = {
  id: string;
  name: string;
  categories: string[];
  description?: string;
  cost: number;
  durationMinutes?: {
    min?: number;
    max?: number;
  };
  bestMonthsOfYear?: string[];
  bestDaysOfWeek?: string[];
  bestTimesOfDay?: Array<{
    startHour12: string;
    endHour12: string;
    startPeriod: string;
    endPeriod: string;
  }>;
};

export type ResponsePlace = {
  id: string;
  name: string;
  address: string;
  types: string[];
  googleMapsUri: string;
  rating: number | null;
  sourceKind: "place" | "activity" | "recipe";
  location: {
    latitude: number | null;
    longitude: number | null;
  };
};

export type ScheduledStep = {
  title: string;
  slot: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  place: ResponsePlace | null;
  travelToNextMinutes: number | null;
};

export type PlannerTemplate = {
  template: string;
  slots: string[];
};

type CategoryTemplateSet = {
  short: PlannerTemplate[];
  standard: PlannerTemplate[];
  long: PlannerTemplate[];
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

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

export type GenerateDatePlannerIdeasResult = {
  sourceFile: string;
  totalMatches: number;
  matchedPlaces: ResponsePlace[];
  templates: PlannerTemplate[];
  ideas: Array<{
    template: string;
    filledTemplate: string;
    commuteToFirstMinutes: number | null;
    commuteFromLastMinutes: number | null;
    places: Record<string, ResponsePlace | null>;
    schedule: ScheduledStep[];
  }>;
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
    "fishing_pond",
  ],
  Sports: [
    "gym",
    "sports_club",
    "sports_complex",
    "sports_activity_location",
    "athletic_field",
    "golf_course",
    "tennis_court",
    "swimming_pool",
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
  Learning: ["museum", "library", "book_store"],
  Shopping: [
    "shopping_mall",
    "department_store",
    "clothing_store",
    "gift_shop",
    "toy_store",
    "thrift_store",
    "store",
  ],
  Recreation: [
    "movie_theater",
    "tourist_attraction",
    "video_arcade",
    "amusement_park",
    "playground",
    "campground",
  ],
};

const SLOT_TYPE_MAP: Record<string, string[]> = {
  dessert: ["bakery", "ice_cream_shop", "cafe", "dessert_restaurant"],
  park: ["park", "nature_preserve", "hiking_area", "lake"],
  meal: ["restaurant", "meal_takeaway", "pizza_restaurant", "cafe"],
  shop: ["shopping_mall", "department_store", "clothing_store", "store"],
  learningSpot: ["museum", "library", "book_store", "tourist_attraction"],
  activity: [
    "movie_theater",
    "sports_activity_location",
    "sports_club",
    "gym",
    "video_arcade",
    "tourist_attraction",
  ],
  sports: ["gym", "sports_club", "sports_complex", "golf_course"],
  scenic: ["scenic_spot", "park", "river", "lake", "mountain_peak"],
};

const CATEGORY_SLOT_MAP: Record<string, string[]> = {
  Food: ["meal", "dessert"],
  Outdoors: ["park", "scenic"],
  Sports: ["sports", "activity"],
  Nature: ["park", "scenic"],
  Learning: ["learningSpot"],
  Shopping: ["shop"],
  Recreation: ["activity"],
};

const SHORT_DATE_TEMPLATES: PlannerTemplate[] = [
  { template: "Get a quick dessert at {dessert}", slots: ["dessert"] },
  { template: "Take a short walk at {park}", slots: ["park"] },
  { template: "Grab a bite at {meal}", slots: ["meal"] },
  { template: "Do a quick activity at {activity}", slots: ["activity"] },
];

const STANDARD_DATE_TEMPLATES: PlannerTemplate[] = [
  {
    template: "Get dessert at {dessert} and walk at {park}",
    slots: ["dessert", "park"],
  },
  {
    template: "Eat at {meal} and then explore {park}",
    slots: ["meal", "park"],
  },
  {
    template: "Grab food at {meal} and do an activity at {activity}",
    slots: ["meal", "activity"],
  },
  {
    template: "Visit {learningSpot} and then get dessert at {dessert}",
    slots: ["learningSpot", "dessert"],
  },
  {
    template: "Start at {shop}, then wind down at {dessert}",
    slots: ["shop", "dessert"],
  },
  {
    template: "Do something active at {sports} and end at {meal}",
    slots: ["sports", "meal"],
  },
  {
    template: "Walk through {scenic} and eat at {meal}",
    slots: ["scenic", "meal"],
  },
  {
    template:
      "Eat at {meal}, spend time at {activity}, then get dessert at {dessert}",
    slots: ["meal", "activity", "dessert"],
  },
  {
    template: "Cook {recipe} at home and then walk at {park}",
    slots: ["park"],
  },
  {
    template: "Cook {recipe} together, then get dessert at {dessert}",
    slots: ["dessert"],
  },
];

const LONG_DATE_TEMPLATES: PlannerTemplate[] = [
  {
    template:
      "Start at {park}, eat at {meal}, do something fun at {activity}, then finish with dessert at {dessert}",
    slots: ["park", "meal", "activity", "dessert"],
  },
  {
    template:
      "Begin at {learningSpot}, browse {shop}, grab food at {meal}, and end with a walk at {scenic}",
    slots: ["learningSpot", "shop", "meal", "scenic"],
  },
  {
    template:
      "Do something active at {sports}, explore {park}, eat at {meal}, and wrap up at {dessert}",
    slots: ["sports", "park", "meal", "dessert"],
  },
  {
    template:
      "Start with shopping at {shop}, then {activity}, dinner at {meal}, and a final stop at {park}",
    slots: ["shop", "activity", "meal", "park"],
  },
  {
    template:
      "Cook {recipe} at home, take a walk at {park}, then end with dessert at {dessert}",
    slots: ["park", "dessert"],
  },
];

const CATEGORY_SPECIFIC_TEMPLATES: Record<string, CategoryTemplateSet> = {
  Food: {
    short: [
      { template: "Grab a quick treat at {dessert}", slots: ["dessert"] },
      { template: "Pick up a fast bite from {meal}", slots: ["meal"] },
      {
        template: "Cook {recipe} at home and share dessert at {dessert}",
        slots: ["dessert"],
      },
      {
        template: "Make {recipe} together, then stop by {dessert}",
        slots: ["dessert"],
      },
    ],
    standard: [
      {
        template: "Start with food at {meal} and then get a sweet at {dessert}",
        slots: ["meal", "dessert"],
      },
      {
        template: "Try {meal}, then chill with a drink or dessert at {dessert}",
        slots: ["meal", "dessert"],
      },
      {
        template:
          "Get dessert at {dessert}, then head to {meal} for something savory",
        slots: ["dessert", "meal"],
      },
      {
        template:
          "Cook {recipe} at her apartment and then grab dessert at {dessert}",
        slots: ["dessert"],
      },
      {
        template:
          "Cook {recipe} together, then if you still want a bite, go to {meal}",
        slots: ["meal"],
      },
      {
        template:
          "Make {recipe} at home and close the night with something sweet at {dessert}",
        slots: ["dessert"],
      },
    ],
    long: [
      {
        template:
          "Begin at {meal}, grab dessert at {dessert}, then finish with another food stop at {meal}",
        slots: ["meal", "dessert", "meal"],
      },
      {
        template:
          "Do a full food date with {meal}, then {dessert}, and end with another bite at {meal}",
        slots: ["meal", "dessert", "meal"],
      },
      {
        template:
          "Cook {recipe} together, get dessert at {dessert}, and later grab food at {meal}",
        slots: ["dessert", "meal"],
      },
      {
        template:
          "Start by cooking {recipe} at home, then do a food crawl with {meal} and {dessert}",
        slots: ["meal", "dessert"],
      },
    ],
  },
  Outdoors: {
    short: [
      { template: "Take a quick walk at {park}", slots: ["park"] },
      { template: "Visit a scenic spot at {scenic}", slots: ["scenic"] },
    ],
    standard: [
      {
        template: "Start at {park} and then explore {scenic}",
        slots: ["park", "scenic"],
      },
      {
        template: "Spend time outside at {scenic}, then unwind at {park}",
        slots: ["scenic", "park"],
      },
      {
        template: "Do an outdoor loop: {park} then {scenic}",
        slots: ["park", "scenic"],
      },
    ],
    long: [
      {
        template:
          "Have a longer outdoor date: start at {park}, continue to {scenic}, and finish at {park}",
        slots: ["park", "scenic", "park"],
      },
      {
        template:
          "Explore multiple outdoor spots with {scenic}, then {park}, then another scenic stop at {scenic}",
        slots: ["scenic", "park", "scenic"],
      },
    ],
  },
  Sports: {
    short: [
      { template: "Get active at {sports}", slots: ["sports"] },
      { template: "{activity}", slots: ["activity"] },
    ],
    standard: [
      {
        template: "Start with a workout at {sports}, and then {activity}",
        slots: ["sports", "activity"],
      },
      {
        template: "Do a sports-focused date with {activity} and then {sports}",
        slots: ["activity", "sports"],
      },
      {
        template: "Begin at {sports}, then keep moving at {activity}",
        slots: ["sports", "activity"],
      },
    ],
    long: [
      {
        template:
          "Go all-in on activity: {sports}, then {activity}, then another stop at {sports}",
        slots: ["sports", "activity", "sports"],
      },
      {
        template:
          "Build a longer active date at {activity}, {sports}, and {activity}",
        slots: ["activity", "sports", "activity"],
      },
    ],
  },
  Nature: {
    short: [
      { template: "Take in nature at {scenic}", slots: ["scenic"] },
      { template: "Enjoy a calm nature walk at {park}", slots: ["park"] },
    ],
    standard: [
      {
        template: "Start with nature views at {scenic} and then visit {park}",
        slots: ["scenic", "park"],
      },
      {
        template:
          "Go to {park}, then check out another natural spot at {scenic}",
        slots: ["park", "scenic"],
      },
      {
        template: "Do a peaceful nature date with {scenic} and {park}",
        slots: ["scenic", "park"],
      },
    ],
    long: [
      {
        template:
          "Take your time in nature: {park}, then {scenic}, then another stop at {park}",
        slots: ["park", "scenic", "park"],
      },
      {
        template: "Spend a long nature date at {scenic}, {park}, and {scenic}",
        slots: ["scenic", "park", "scenic"],
      },
    ],
  },
  Learning: {
    short: [
      {
        template: "Visit a learning spot at {learningSpot}",
        slots: ["learningSpot"],
      },
      {
        template: "Do a quick cultural stop at {learningSpot}",
        slots: ["learningSpot"],
      },
    ],
    standard: [
      {
        template:
          "Start at {learningSpot} and then continue learning at {learningSpot}",
        slots: ["learningSpot", "learningSpot"],
      },
      {
        template:
          "Explore one learning destination at {learningSpot}, then another at {learningSpot}",
        slots: ["learningSpot", "learningSpot"],
      },
      {
        template:
          "Plan an educational date around {learningSpot} and {learningSpot}",
        slots: ["learningSpot", "learningSpot"],
      },
    ],
    long: [
      {
        template:
          "Build a full learning date with stops at {learningSpot}, {learningSpot}, and {learningSpot}",
        slots: ["learningSpot", "learningSpot", "learningSpot"],
      },
      {
        template:
          "Spend a long educational date exploring {learningSpot}, then {learningSpot}, then {learningSpot}",
        slots: ["learningSpot", "learningSpot", "learningSpot"],
      },
    ],
  },
  Shopping: {
    short: [
      { template: "Make a quick shopping stop at {shop}", slots: ["shop"] },
      { template: "Browse stores at {shop}", slots: ["shop"] },
    ],
    standard: [
      {
        template: "Start shopping at {shop} and then grab food at {meal}",
        slots: ["shop", "meal"],
      },
      {
        template: "Browse {shop}, then get a treat at {dessert}",
        slots: ["shop", "dessert"],
      },
      {
        template:
          "Do a shopping date with {shop} and then another stop at {shop}",
        slots: ["shop", "shop"],
      },
    ],
    long: [
      {
        template:
          "Spend a longer shopping date at {shop}, then {meal}, then back to {shop}",
        slots: ["shop", "meal", "shop"],
      },
      {
        template:
          "Shop around at {shop}, get dessert at {dessert}, and finish browsing at {shop}",
        slots: ["shop", "dessert", "shop"],
      },
    ],
  },
  Recreation: {
    short: [
      {
        template: "Do a quick fun activity at {activity}",
        slots: ["activity"],
      },
      { template: "Enjoy a short outing at {activity}", slots: ["activity"] },
    ],
    standard: [
      {
        template: "Start with fun at {activity} then head to {park}",
        slots: ["activity", "park"],
      },
      {
        template: "Do something playful at {activity} and then eat at {meal}",
        slots: ["activity", "meal"],
      },
      {
        template:
          "Build a recreation date with {activity} and another stop at {activity}",
        slots: ["activity", "activity"],
      },
    ],
    long: [
      {
        template:
          "Have a long fun date with {activity}, then {meal}, and end at {activity}",
        slots: ["activity", "meal", "activity"],
      },
      {
        template:
          "Plan a longer recreation date at {activity}, {park}, and {activity}",
        slots: ["activity", "park", "activity"],
      },
    ],
  },
};

const DATE_TEMPLATES: PlannerTemplate[] = [
  ...SHORT_DATE_TEMPLATES,
  ...STANDARD_DATE_TEMPLATES,
  ...LONG_DATE_TEMPLATES,
  ...Object.values(CATEGORY_SPECIFIC_TEMPLATES).flatMap((templateSet) => [
    ...templateSet.short,
    ...templateSet.standard,
    ...templateSet.long,
  ]),
];

const FALLBACK_TEMPLATE: PlannerTemplate = {
  template: "Spend time at {activity}",
  slots: ["activity"],
};

const PAID_WHEN_NO_PRICE_TYPES = new Set([
  "restaurant",
  "meal_takeaway",
  "cafe",
  "bakery",
  "ice_cream_shop",
  "dessert_restaurant",
  "coffee_shop",
  "pizza_restaurant",
  "sandwich_shop",
  "movie_theater",
  "video_arcade",
  "amusement_park",
  "gym",
  "sports_club",
  "sports_complex",
  "sports_activity_location",
  "golf_course",
]);

const FREE_WHEN_NO_PRICE_TYPES = new Set([
  "park",
  "nature_preserve",
  "hiking_area",
  "river",
  "lake",
  "scenic_spot",
  "mountain_peak",
  "library",
  "playground",
]);

const PRICE_LEVEL_TO_ESTIMATED_SPEND: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 15,
  PRICE_LEVEL_MODERATE: 35,
  PRICE_LEVEL_EXPENSIVE: 70,
  PRICE_LEVEL_VERY_EXPENSIVE: 110,
  PRICE_LEVEL_UNSPECIFIED: 15,
};

const MAX_MATCHED_CANDIDATES = 250;

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const CATEGORY_TO_ACTIVITY_TYPES: Record<string, string[]> = {
  Food: ["restaurant", "dessert_restaurant", "cafe"],
  Outdoors: ["park", "scenic_spot", "tourist_attraction"],
  Sports: ["sports_activity_location", "gym", "sports_club"],
  Nature: ["park", "scenic_spot", "nature_preserve"],
  Learning: ["museum", "library", "book_store"],
  Shopping: ["shopping_mall", "store", "gift_shop"],
  Recreation: ["video_arcade", "movie_theater", "tourist_attraction"],
};

function to24Hour(hour12Text: string | undefined, period: string | undefined) {
  const hour12 = Number.parseInt(hour12Text || "", 10);
  if (Number.isNaN(hour12) || hour12 < 1 || hour12 > 12) {
    return null;
  }

  const normalizedPeriod = (period || "").toUpperCase();
  if (normalizedPeriod !== "AM" && normalizedPeriod !== "PM") {
    return null;
  }

  if (normalizedPeriod === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
}

function toPriceLevelFromCost(maxCost?: number) {
  if (typeof maxCost !== "number" || Number.isNaN(maxCost)) {
    return "PRICE_LEVEL_UNSPECIFIED";
  }

  if (maxCost <= 0) return "PRICE_LEVEL_FREE";
  if (maxCost <= 20) return "PRICE_LEVEL_INEXPENSIVE";
  if (maxCost <= 50) return "PRICE_LEVEL_MODERATE";
  if (maxCost <= 100) return "PRICE_LEVEL_EXPENSIVE";
  return "PRICE_LEVEL_VERY_EXPENSIVE";
}

function buildActivityPeriods(activity: PlannerActivityInput) {
  const selectedDays = (activity.bestDaysOfWeek || [])
    .map((dayName) => DAY_NAME_TO_INDEX[dayName])
    .filter((day): day is number => typeof day === "number");
  const days = selectedDays.length ? selectedDays : [0, 1, 2, 3, 4, 5, 6];
  const timeWindows = activity.bestTimesOfDay || [];

  if (!timeWindows.length) {
    return [] as NonNullable<PlannerPlace["regularOpeningHours"]>["periods"];
  }

  return days.flatMap((day) =>
    timeWindows.flatMap((timeWindow) => {
      const startHour = to24Hour(
        timeWindow.startHour12,
        timeWindow.startPeriod,
      );
      const endHour = to24Hour(timeWindow.endHour12, timeWindow.endPeriod);

      if (startHour === null || endHour === null) {
        return [];
      }

      const crossesMidnight = endHour <= startHour;
      return [
        {
          open: { day, hour: startHour, minute: 0 },
          close: {
            day: crossesMidnight ? (day + 1) % 7 : day,
            hour: endHour,
            minute: 0,
          },
        },
      ];
    }),
  );
}

export function convertActivitiesToPlannerPlaces(
  activities: PlannerActivityInput[],
): PlannerPlace[] {
  return activities.map((activity) => {
    const mappedTypes = Array.from(
      new Set(
        activity.categories.flatMap(
          (category) =>
            CATEGORY_TO_ACTIVITY_TYPES[category] || ["tourist_attraction"],
        ),
      ),
    );
    const periods = buildActivityPeriods(activity);
    return {
      id: activity.id,
      types: mappedTypes,
      formattedAddress: activity.description || "At-home activity",
      googleMapsUri: "",
      rating: undefined,
      priceLevel: toPriceLevelFromCost(activity.cost),
      location: undefined,
      businessStatus: "OPERATIONAL",
      displayName: { text: activity.name },
      regularOpeningHours: periods.length ? { periods } : undefined,
      sourceKind: "activity",
      activeMonths: activity.bestMonthsOfYear || [],
      activityMinDurationMinutes:
        typeof activity.durationMinutes?.min === "number"
          ? activity.durationMinutes.min
          : undefined,
    };
  });
}

function toMinuteOfWeek(day: number, hour = 0, minute = 0): number {
  return day * 1440 + hour * 60 + minute;
}

function minuteOfWeekFromDate(date: Date, minuteOfDay: number): number {
  const normalized = ((minuteOfDay % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return toMinuteOfWeek(date.getDay(), hour, minute);
}

function isOpenForWindow(
  place: PlannerPlace,
  date: Date,
  startMinuteOfDay: number,
  endMinuteOfDay: number,
): boolean {
  const periods = place.regularOpeningHours?.periods || [];
  if (!periods.length) return false;

  const windowStart = minuteOfWeekFromDate(date, startMinuteOfDay);
  const windowEndRaw = minuteOfWeekFromDate(date, endMinuteOfDay);
  const windowEnd =
    endMinuteOfDay <= startMinuteOfDay ? windowEndRaw + 1440 : windowEndRaw;

  for (const period of periods) {
    const open = period.open;
    const close = period.close;
    if (
      typeof open?.day !== "number" ||
      typeof open?.hour !== "number" ||
      typeof close?.day !== "number" ||
      typeof close?.hour !== "number"
    ) {
      continue;
    }

    const periodStart = toMinuteOfWeek(open.day, open.hour, open.minute || 0);
    let periodEnd = toMinuteOfWeek(close.day, close.hour, close.minute || 0);
    if (periodEnd <= periodStart) periodEnd += 10080;

    for (const shift of [0, 10080, -10080]) {
      const shiftedStart = periodStart + shift;
      const shiftedEnd = periodEnd + shift;
      if (windowStart >= shiftedStart && windowEnd <= shiftedEnd) {
        return true;
      }
    }
  }

  return false;
}

function hasMinimumOverlapForWindow(
  place: PlannerPlace,
  date: Date,
  startMinuteOfDay: number,
  endMinuteOfDay: number,
  minimumMinutes: number,
): boolean {
  const periods = place.regularOpeningHours?.periods || [];
  if (!periods.length) return false;

  const windowStart = minuteOfWeekFromDate(date, startMinuteOfDay);
  const windowEndRaw = minuteOfWeekFromDate(date, endMinuteOfDay);
  const windowEnd =
    endMinuteOfDay <= startMinuteOfDay ? windowEndRaw + 1440 : windowEndRaw;

  const requiredMinutes = Math.max(1, minimumMinutes);

  for (const period of periods) {
    const open = period.open;
    const close = period.close;
    if (
      typeof open?.day !== "number" ||
      typeof open?.hour !== "number" ||
      typeof close?.day !== "number" ||
      typeof close?.hour !== "number"
    ) {
      continue;
    }

    const periodStart = toMinuteOfWeek(open.day, open.hour, open.minute || 0);
    let periodEnd = toMinuteOfWeek(close.day, close.hour, close.minute || 0);
    if (periodEnd <= periodStart) periodEnd += 10080;

    for (const shift of [0, 10080, -10080]) {
      const shiftedStart = periodStart + shift;
      const shiftedEnd = periodEnd + shift;
      const overlapStart = Math.max(windowStart, shiftedStart);
      const overlapEnd = Math.min(windowEnd, shiftedEnd);
      if (overlapEnd - overlapStart >= requiredMinutes) {
        return true;
      }
    }
  }

  return false;
}

function isOpenAtAbsoluteMinute(
  place: PlannerPlace,
  startDate: Date,
  absoluteMinute: number,
): boolean {
  const dayOffset = Math.floor(absoluteMinute / 1440);
  const minuteOfDay = ((absoluteMinute % 1440) + 1440) % 1440;
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayOffset);
  return isOpenForWindow(place, targetDate, minuteOfDay, minuteOfDay + 1);
}

function normalizeCategoryTypes(categories: string[]): Set<string> {
  const mapped = categories.flatMap(
    (category) => CATEGORY_TYPE_MAP[category] || [],
  );
  return new Set(mapped);
}

function matchesSelectedCategory(
  place: PlannerPlace,
  categoryTypes: Set<string>,
): boolean {
  if (!categoryTypes.size) return true;
  const placeTypes = place.types || [];
  return placeTypes.some((type) => categoryTypes.has(type));
}

function matchesRequestedMonth(
  place: PlannerPlace,
  requestedDate: Date,
): boolean {
  if (place.sourceKind !== "activity") {
    return true;
  }

  const months = place.activeMonths || [];
  if (!months.length) {
    return true;
  }

  const monthName = requestedDate.toLocaleString("en-US", { month: "long" });
  return months.includes(monthName);
}

function toResponsePlace(place: PlannerPlace): ResponsePlace {
  return {
    id: place.id,
    name: place.displayName?.text || "Unknown place",
    address: place.formattedAddress || "",
    types: place.types || [],
    googleMapsUri: place.googleMapsUri || "",
    rating: place.rating || null,
    sourceKind: place.sourceKind || "place",
    location: {
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
    },
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMilesBetween(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(latitude2 - latitude1);
  const dLon = toRadians(longitude2 - longitude1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function distanceMilesFromUser(
  userLocation: UserLocation | null,
  place: PlannerPlace,
): number | null {
  if (!userLocation) return null;

  const lat = place.location?.latitude;
  const lon = place.location?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  return distanceMilesBetween(
    userLocation.latitude,
    userLocation.longitude,
    lat,
    lon,
  );
}

function estimatePlaceSpend(place: PlannerPlace): number | null {
  const rawLevel = (place.priceLevel || "").trim();
  if (rawLevel) {
    if (
      Object.prototype.hasOwnProperty.call(
        PRICE_LEVEL_TO_ESTIMATED_SPEND,
        rawLevel,
      )
    ) {
      return PRICE_LEVEL_TO_ESTIMATED_SPEND[rawLevel];
    }

    const types = place.types || [];
    if (types.some((type) => PAID_WHEN_NO_PRICE_TYPES.has(type))) {
      return 15;
    }

    return 0;
  }

  const types = place.types || [];
  if (types.some((type) => PAID_WHEN_NO_PRICE_TYPES.has(type))) {
    return 15;
  }

  return 0;
}

function matchesBudget(place: PlannerPlace, maxPrice?: number): boolean {
  if (typeof maxPrice !== "number" || Number.isNaN(maxPrice)) {
    return true;
  }

  if (maxPrice <= 0) {
    const rawLevel = (place.priceLevel || "").trim();
    if (rawLevel) {
      return rawLevel === "PRICE_LEVEL_FREE";
    }

    const types = place.types || [];
    return types.some((type) => FREE_WHEN_NO_PRICE_TYPES.has(type));
  }

  const estimatedSpend = estimatePlaceSpend(place);
  if (estimatedSpend === null) return true;

  return estimatedSpend <= maxPrice;
}

function matchesDistance(
  place: PlannerPlace,
  userLocation: UserLocation | null,
  maxDistanceMiles?: number,
): boolean {
  if (
    typeof maxDistanceMiles !== "number" ||
    Number.isNaN(maxDistanceMiles) ||
    !userLocation
  ) {
    return true;
  }

  const miles = distanceMilesFromUser(userLocation, place);
  if (miles === null) return true;
  return miles <= maxDistanceMiles;
}

function estimateTravelMinutes(
  fromPlace: ResponsePlace | null,
  toPlace: ResponsePlace | null,
) {
  if (!fromPlace || !toPlace) return null;

  const lat1 = fromPlace.location?.latitude;
  const lon1 = fromPlace.location?.longitude;
  const lat2 = toPlace.location?.latitude;
  const lon2 = toPlace.location?.longitude;

  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    return null;
  }

  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineMiles = earthRadiusMiles * c;

  const estimatedRoadMiles = straightLineMiles * 1.25;
  const averageCityMph = 25;
  const minutes = (estimatedRoadMiles / averageCityMph) * 60;
  const buffered = minutes + 5;

  return Math.max(5, Math.min(60, Math.round(buffered)));
}

function estimateTravelMinutesFromLocation(
  fromLocation: UserLocation | null,
  toPlace: ResponsePlace | null,
) {
  if (!fromLocation) return null;
  const pseudoFromPlace = {
    location: {
      latitude: fromLocation.latitude,
      longitude: fromLocation.longitude,
    },
  } as ResponsePlace;
  return estimateTravelMinutes(pseudoFromPlace, toPlace);
}

function buildBuckets(places: PlannerPlace[]) {
  const buckets: Record<string, ResponsePlace[]> = {
    dessert: [],
    park: [],
    meal: [],
    shop: [],
    learningSpot: [],
    activity: [],
    sports: [],
    scenic: [],
  };

  for (const place of places) {
    const responsePlace = toResponsePlace(place);
    const types = responsePlace.types || [];
    for (const [slot, mappedTypes] of Object.entries(SLOT_TYPE_MAP)) {
      if (types.some((type) => mappedTypes.includes(type))) {
        buckets[slot].push(responsePlace);
      }
    }
  }

  return buckets;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function computeWindowDurationMinutes(startHour: number, endHour: number) {
  const start = startHour * 60;
  let end = endHour * 60;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function distributeMinutes(total: number, count: number) {
  if (count <= 0) return [] as number[];
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from(
    { length: count },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function formatMinutesTo12Hour(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minuteText = String(minute).padStart(2, "0");
  return `${hour12}:${minuteText} ${period}`;
}

function getStepCountByDuration(totalMinutes: number) {
  if (totalMinutes <= 90) return 1;
  if (totalMinutes <= 180) return 2;
  if (totalMinutes <= 300) return 3;
  if (totalMinutes <= 420) return 4;
  return 5;
}

function getTemplatePoolByDuration(totalMinutes: number): PlannerTemplate[] {
  if (totalMinutes <= 90) return SHORT_DATE_TEMPLATES;
  if (totalMinutes >= 330) return LONG_DATE_TEMPLATES;
  return STANDARD_DATE_TEMPLATES;
}

function chooseTemplateByDuration(
  totalMinutes: number,
  indexSeed: number,
  selectedCategories: string[],
  allowedSlots: Set<string>,
): PlannerTemplate {
  const filterTemplatesByAllowedSlots = (templates: PlannerTemplate[]) =>
    templates.filter((template) =>
      template.slots.every((slot) => allowedSlots.has(slot)),
    );

  if (selectedCategories.length === 1) {
    const categoryName = selectedCategories[0];
    const categoryTemplates = CATEGORY_SPECIFIC_TEMPLATES[categoryName];

    if (categoryTemplates) {
      const categoryPool =
        totalMinutes <= 90
          ? categoryTemplates.short
          : totalMinutes >= 330
            ? categoryTemplates.long
            : categoryTemplates.standard;

      const filteredCategoryPool = filterTemplatesByAllowedSlots(categoryPool);
      if (filteredCategoryPool.length) {
        return filteredCategoryPool[indexSeed % filteredCategoryPool.length];
      }
    }
  }

  const pool = filterTemplatesByAllowedSlots(
    getTemplatePoolByDuration(totalMinutes),
  );
  if (!pool.length) {
    const allowedSlot = Array.from(allowedSlots)[0];
    if (allowedSlot) {
      return {
        template: `Spend time at {${allowedSlot}}`,
        slots: [allowedSlot],
      };
    }
    return FALLBACK_TEMPLATE;
  }

  return pool[indexSeed % pool.length];
}

function fillTemplateText(
  template: string,
  placesBySlot: Record<string, ResponsePlace | null>,
) {
  let text = template;
  for (const [slot, place] of Object.entries(placesBySlot)) {
    text = text.replace(`{${slot}}`, place?.name || "a local spot");
  }
  return text;
}

function normalizeTemplateSlots(
  templateSlots: string[],
  allSlots: string[],
  maxStepCount: number,
  minStepCount: number,
) {
  const filteredTemplateSlots = templateSlots.filter((slot) =>
    allSlots.includes(slot),
  );
  const slotPool = filteredTemplateSlots.length
    ? filteredTemplateSlots
    : allSlots.length
      ? shuffleArray(allSlots)
      : ["activity"];

  const targetStepCount = Math.max(
    1,
    Math.min(maxStepCount, Math.max(minStepCount, slotPool.length)),
  );

  const expandedSlots: string[] = [];
  for (let i = 0; i < targetStepCount; i++) {
    expandedSlots.push(slotPool[i % slotPool.length]);
  }
  return expandedSlots;
}

function pickPlaceForSlot(
  slot: string,
  buckets: Record<string, ResponsePlace[]>,
  usedPlaceIds: Set<string>,
) {
  const choices = shuffleArray(buckets[slot] || []);
  const unused = choices.find((place) => !usedPlaceIds.has(place.id));
  const picked = unused || choices[0] || null;
  if (picked) usedPlaceIds.add(picked.id);
  return picked;
}

function ensurePlaceOpenAtMinute(
  place: ResponsePlace | null,
  placeById: Record<string, PlannerPlace>,
  requestedDate: Date,
  absoluteMinute: number,
) {
  if (!place) return false;
  const source = placeById[place.id];
  if (!source) return false;

  return isOpenAtAbsoluteMinute(source, requestedDate, absoluteMinute);
}

function pickReplacementOpenAtMinute(
  slot: string,
  buckets: Record<string, ResponsePlace[]>,
  usedPlaceIds: Set<string>,
  placeById: Record<string, PlannerPlace>,
  requestedDate: Date,
  absoluteMinute: number,
) {
  const candidates = shuffleArray(buckets[slot] || []);
  const viable = candidates.filter((candidate) => {
    if (usedPlaceIds.has(candidate.id)) {
      return false;
    }
    return ensurePlaceOpenAtMinute(
      candidate,
      placeById,
      requestedDate,
      absoluteMinute,
    );
  });

  const replacement = viable[0] || null;
  if (replacement) {
    usedPlaceIds.add(replacement.id);
  }
  return replacement;
}

function buildScheduleIdea(
  buckets: Record<string, ResponsePlace[]>,
  placeById: Record<string, PlannerPlace>,
  requestedDate: Date,
  startHour: number,
  endHour: number,
  indexSeed: number,
  selectedCategories: string[],
  userLocation: UserLocation | null,
) {
  const totalMinutes = computeWindowDurationMinutes(startHour, endHour);
  const maxStepCount = getStepCountByDuration(totalMinutes);
  const minStepCount = totalMinutes >= 330 ? 3 : totalMinutes >= 180 ? 2 : 1;

  const allowedSlots = new Set(
    selectedCategories.flatMap((category) => CATEGORY_SLOT_MAP[category] || []),
  );
  if (!allowedSlots.size) {
    Object.keys(SLOT_TYPE_MAP).forEach((slot) => allowedSlots.add(slot));
  }

  const allSlots = Object.keys(buckets).filter(
    (slot) => allowedSlots.has(slot) && buckets[slot].length > 0,
  );

  const templateAllowedSlots = allSlots.length
    ? new Set(allSlots)
    : allowedSlots;

  const selectedTemplate = chooseTemplateByDuration(
    totalMinutes,
    indexSeed,
    selectedCategories,
    templateAllowedSlots,
  );

  const slotPool = normalizeTemplateSlots(
    selectedTemplate.slots,
    allSlots,
    maxStepCount,
    minStepCount,
  );

  const stepCount = Math.max(minStepCount, slotPool.length);
  const selectedSlots: string[] = [];
  for (let i = 0; i < stepCount; i++) {
    selectedSlots.push(slotPool[i % slotPool.length]);
  }

  const usedPlaceIds = new Set<string>();
  const selectedPlaces = selectedSlots.map((slot) =>
    pickPlaceForSlot(slot, buckets, usedPlaceIds),
  );

  const commuteToFirstMinutes = estimateTravelMinutesFromLocation(
    userLocation,
    selectedPlaces[0] || null,
  );
  const commuteFromLastMinutes = estimateTravelMinutesFromLocation(
    userLocation,
    selectedPlaces[selectedPlaces.length - 1] || null,
  );
  const edgeTravelMinutes =
    (commuteToFirstMinutes || 0) + (commuteFromLastMinutes || 0);

  const rawTravelMinutes = Array.from(
    { length: Math.max(0, stepCount - 1) },
    (_, index) =>
      estimateTravelMinutes(selectedPlaces[index], selectedPlaces[index + 1]) ??
      12,
  );

  let adjustedTravelMinutes = [...rawTravelMinutes];
  let totalTravelMinutes = adjustedTravelMinutes.reduce(
    (sum, minutes) => sum + minutes,
    0,
  );

  const totalAvailableMinutes = Math.max(
    stepCount,
    totalMinutes - edgeTravelMinutes,
  );

  let minActivityMinutes = 20;
  if (
    totalTravelMinutes + minActivityMinutes * stepCount >
    totalAvailableMinutes
  ) {
    minActivityMinutes = 10;
  }

  if (
    totalTravelMinutes + minActivityMinutes * stepCount >
    totalAvailableMinutes
  ) {
    const allowedTravel = Math.max(
      0,
      totalAvailableMinutes - minActivityMinutes * stepCount,
    );

    if (totalTravelMinutes > 0) {
      const scaled = adjustedTravelMinutes.map((minutes) =>
        Math.floor((minutes * allowedTravel) / totalTravelMinutes),
      );
      let leftover =
        allowedTravel - scaled.reduce((sum, minutes) => sum + minutes, 0);

      for (let i = 0; i < scaled.length && leftover > 0; i++) {
        scaled[i] += 1;
        leftover -= 1;
      }

      adjustedTravelMinutes = scaled;
      totalTravelMinutes = adjustedTravelMinutes.reduce(
        (sum, minutes) => sum + minutes,
        0,
      );
    }
  }

  const totalActivityMinutes = Math.max(
    stepCount,
    totalAvailableMinutes - totalTravelMinutes,
  );
  const activityDurations = distributeMinutes(totalActivityMinutes, stepCount);

  let validationCursor = startHour * 60 + (commuteToFirstMinutes || 0);
  for (let stepIndex = 0; stepIndex < selectedSlots.length; stepIndex++) {
    const currentPlace = selectedPlaces[stepIndex];
    const isOpen = ensurePlaceOpenAtMinute(
      currentPlace,
      placeById,
      requestedDate,
      validationCursor,
    );

    if (!isOpen) {
      if (currentPlace) {
        usedPlaceIds.delete(currentPlace.id);
      }
      selectedPlaces[stepIndex] = pickReplacementOpenAtMinute(
        selectedSlots[stepIndex],
        buckets,
        usedPlaceIds,
        placeById,
        requestedDate,
        validationCursor,
      );
    }

    const travelToNext = adjustedTravelMinutes[stepIndex] || 0;
    validationCursor += (activityDurations[stepIndex] || 1) + travelToNext;
  }

  let cursor = startHour * 60 + (commuteToFirstMinutes || 0);
  const schedule: ScheduledStep[] = selectedSlots.map((slot, stepIndex) => {
    const durationMinutes = activityDurations[stepIndex] || 1;
    const startMinute = cursor;
    const endMinute = startMinute + durationMinutes;
    const place = selectedPlaces[stepIndex];

    const travelToNextMinutes =
      stepIndex < adjustedTravelMinutes.length
        ? adjustedTravelMinutes[stepIndex]
        : null;

    const displayedEndMinute = endMinute;

    cursor = endMinute + (travelToNextMinutes || 0);

    return {
      title: `Spend time at ${place?.name || "a local spot"}`,
      slot,
      startTime: formatMinutesTo12Hour(startMinute),
      endTime: formatMinutesTo12Hour(displayedEndMinute),
      durationMinutes,
      place,
      travelToNextMinutes,
    };
  });

  const placesBySlot = Object.fromEntries(
    schedule.map((step) => [step.slot, step.place]),
  ) as Record<string, ResponsePlace | null>;

  return {
    template: selectedTemplate.template,
    filledTemplate: fillTemplateText(selectedTemplate.template, placesBySlot),
    commuteToFirstMinutes,
    commuteFromLastMinutes,
    places: placesBySlot,
    schedule,
  };
}

export function generateDatePlannerIdeasFromPlaces(input: {
  places: PlannerPlace[];
  request: GenerateDatePlannerIdeasRequest;
  sourceFile: string;
}): GenerateDatePlannerIdeasResult {
  const { places, request, sourceFile } = input;

  const requestedDate = new Date(`${request.date}T12:00:00`);
  if (Number.isNaN(requestedDate.getTime())) {
    throw new Error("Invalid date format. Use YYYY-MM-DD.");
  }

  const categoryTypes = normalizeCategoryTypes(request.categories);

  const userLocation: UserLocation | null =
    typeof request.userLatitude === "number" &&
    typeof request.userLongitude === "number"
      ? { latitude: request.userLatitude, longitude: request.userLongitude }
      : null;

  const filtered = places.filter((place) => {
    if (place.businessStatus && place.businessStatus !== "OPERATIONAL") {
      return false;
    }

    if (!matchesRequestedMonth(place, requestedDate)) {
      return false;
    }

    if (!matchesSelectedCategory(place, categoryTypes)) {
      return false;
    }

    if (!matchesBudget(place, request.maxPrice)) {
      return false;
    }

    if (!matchesDistance(place, userLocation, request.maxDistanceMiles)) {
      return false;
    }

    const startMinute = request.startHour * 60;
    const endMinute = request.endHour * 60;

    if (place.sourceKind === "activity") {
      const minDuration =
        typeof place.activityMinDurationMinutes === "number"
          ? place.activityMinDurationMinutes
          : 30;

      return hasMinimumOverlapForWindow(
        place,
        requestedDate,
        startMinute,
        endMinute,
        minDuration,
      );
    }

    return isOpenForWindow(place, requestedDate, startMinute, endMinute);
  });

  const filteredActivities = filtered.filter(
    (place) => place.sourceKind === "activity",
  );
  const filteredPlaces = filtered.filter(
    (place) => place.sourceKind !== "activity",
  );

  const shuffledActivities = shuffleArray(filteredActivities);
  const shuffledPlaces = shuffleArray(filteredPlaces);

  const remainingCapacity = Math.max(
    0,
    MAX_MATCHED_CANDIDATES - shuffledActivities.length,
  );

  const limitedPlaces = [
    ...shuffledActivities,
    ...shuffledPlaces.slice(0, remainingCapacity),
  ].slice(0, MAX_MATCHED_CANDIDATES);
  const buckets = buildBuckets(limitedPlaces);
  const placeById = Object.fromEntries(
    limitedPlaces.map((place) => [place.id, place]),
  ) as Record<string, PlannerPlace>;

  const ideas = Array.from({ length: request.ideaCount }, (_, index) =>
    buildScheduleIdea(
      buckets,
      placeById,
      requestedDate,
      request.startHour,
      request.endHour,
      index,
      request.categories,
      userLocation,
    ),
  );

  return {
    sourceFile,
    totalMatches: filtered.length,
    matchedPlaces: filtered.map(toResponsePlace),
    templates: DATE_TEMPLATES,
    ideas,
  };
}
