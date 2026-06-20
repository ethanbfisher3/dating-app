import type { DateCategory } from "../utils/utils";

type TemplateDefinition = {
  template: string;
  slots: string[];
};

export type TemplateLike = TemplateDefinition & {
  categories: DateCategory[];
};

const DATE_CATEGORIES: DateCategory[] = ["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"];

const SLOT_CATEGORY_OPTIONS: Record<string, DateCategory[]> = {
  activity: DATE_CATEGORIES,
  recipe: ["Food"],
  // Food
  restaurant: ["Food"],
  fast_food: ["Food"],
  cafe: ["Food"],
  ice_cream: ["Food"],
  food_court: ["Food"],
  // Outdoors
  park: ["Outdoors"],
  garden: ["Outdoors"],
  nature_reserve: ["Outdoors"],
  recreation_ground: ["Outdoors"],
  dog_park: ["Outdoors"],
  viewpoint: ["Outdoors"],
  picnic_site: ["Outdoors"],
  camp_site: ["Outdoors"],
  // Sports
  fitness_centre: ["Sports"],
  gym: ["Sports"],
  sports_centre: ["Sports"],
  swimming_pool: ["Sports"],
  ice_rink: ["Sports"],
  tennis: ["Sports"],
  golf: ["Sports"],
  // Education
  museum: ["Education"],
  art_gallery: ["Education"],
  library: ["Education"],
  historic: ["Education"],
  // Shopping
  mall: ["Shopping"],
  clothes: ["Shopping"],
  books: ["Shopping"],
  gift: ["Shopping"],
  toys: ["Shopping"],
  electronics: ["Shopping"],
  // Entertainment
  cinema: ["Entertainment"],
  bowling_alley: ["Entertainment"],
  miniature_golf: ["Entertainment"],
  amusement_arcade: ["Entertainment"],
  theme_park: ["Entertainment"],
};

function getCategoriesForSlots(slots: string[]): DateCategory[] {
  const categories = new Set<DateCategory>();

  for (const slot of slots) {
    const slotOptions = slot
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);

    for (const option of slotOptions) {
      const optionCategories = SLOT_CATEGORY_OPTIONS[option];
      if (!optionCategories) {
        continue;
      }

      for (const category of optionCategories) {
        categories.add(category);
      }
    }
  }

  if (!categories.size) {
    return [...DATE_CATEGORIES];
  }

  return [...categories];
}

function withCategories(template: TemplateDefinition): TemplateLike {
  return {
    ...template,
    categories: getCategoriesForSlots(template.slots),
  };
}

function getAllowedCategoriesForSlot(slot: string): DateCategory[] {
  const slotOptions = slot
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  const categories = new Set<DateCategory>();

  for (const option of slotOptions) {
    const optionCategories = SLOT_CATEGORY_OPTIONS[option];
    if (!optionCategories) {
      continue;
    }

    for (const category of optionCategories) {
      categories.add(category);
    }
  }

  return [...categories];
}

export function templateMatchesSelectedCategories(
  template: Pick<TemplateLike, "slots">,
  selectedCategories: string[],
): boolean {
  if (!selectedCategories.length) {
    return true;
  }

  const selectedCategorySet = new Set(selectedCategories);

  return template.slots.every((slot) => {
    if (slot === "activity") {
      return true;
    }

    const allowedCategories = getAllowedCategoriesForSlot(slot);
    if (!allowedCategories.length) {
      return true;
    }

    return allowedCategories.some((category) => selectedCategorySet.has(category));
  });
}

// ─── SHORT (≤90 min) ──────────────────────────────────────────────────────────

const SHORT_DATE_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // Single-slot Food
  { template: "Grab coffee and catch up at {cafe}", slots: ["cafe"] },
  { template: "Have dinner at {restaurant}", slots: ["restaurant"] },
  { template: "Grab a quick bite at {fast_food}", slots: ["fast_food"] },
  { template: "Get ice cream at {ice_cream}", slots: ["ice_cream"] },
  // Single-slot Outdoors
  { template: "Take a walk through {park}", slots: ["park"] },
  { template: "Explore {nature_reserve} together", slots: ["nature_reserve"] },
  { template: "Check out the view at {viewpoint}", slots: ["viewpoint"] },
  { template: "Stroll through {garden}", slots: ["garden"] },
  { template: "Have a picnic at {picnic_site}", slots: ["picnic_site"] },
  // Single-slot Sports
  { template: "Work out together at {fitness_centre}", slots: ["fitness_centre"] },
  { template: "Go swimming at {swimming_pool}", slots: ["swimming_pool"] },
  { template: "Ice skate at {ice_rink}", slots: ["ice_rink"] },
  // Single-slot Entertainment
  { template: "Catch a movie at {cinema}", slots: ["cinema"] },
  { template: "Go bowling at {bowling_alley}", slots: ["bowling_alley"] },
  { template: "Play mini golf at {miniature_golf}", slots: ["miniature_golf"] },
  { template: "Hit the arcade at {amusement_arcade}", slots: ["amusement_arcade"] },
  // Single-slot Education
  { template: "Visit {museum}", slots: ["museum"] },
  { template: "Explore {art_gallery}", slots: ["art_gallery"] },
  { template: "Browse books at {library}", slots: ["library"] },
  // Single-slot Shopping
  { template: "Browse {mall} together", slots: ["mall"] },
  { template: "Find some new reads at {books}", slots: ["books"] },
  // Activity / Recipe
  { template: "{activity}", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  // Two-slot combos
  { template: "{activity}, then treat yourselves to ice cream at {ice_cream}", slots: ["activity", "ice_cream"] },
  { template: "Walk through {park}, then grab food at {fast_food}", slots: ["park", "fast_food"] },
  { template: "Find some new reads at {books}, then grab coffee at {cafe}", slots: ["books", "cafe"] },
  { template: "{activity} and then make {recipe}", slots: ["activity", "recipe"] },
  { template: "Make {recipe}, then finish with {activity}", slots: ["recipe", "activity"] },
  { template: "Grab coffee at {cafe}, then {activity}", slots: ["cafe", "activity"] },
  { template: "Get ice cream at {ice_cream} after {activity}", slots: ["activity", "ice_cream"] },
  { template: "Stroll through {park}, then grab coffee at {cafe}", slots: ["park", "cafe"] },
  { template: "Visit {museum}, then grab coffee at {cafe}", slots: ["museum", "cafe"] },
];

export const SHORT_DATE_TEMPLATES: TemplateLike[] = SHORT_DATE_TEMPLATE_DEFINITIONS.map(withCategories);

// ─── STANDARD (90–180 min) ────────────────────────────────────────────────────

const STANDARD_DATE_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // Food + Outdoors
  { template: "Grab coffee at {cafe}, then stroll through {park}", slots: ["cafe", "park"] },
  { template: "Take a walk through {park}, then have dinner at {restaurant}", slots: ["park", "restaurant"] },
  { template: "Stroll through {garden}, then get coffee at {cafe}", slots: ["garden", "cafe"] },
  { template: "Check out the view at {viewpoint}, then have dinner at {restaurant}", slots: ["viewpoint", "restaurant"] },
  { template: "Have a picnic at {picnic_site}, then grab coffee at {cafe}", slots: ["picnic_site", "cafe"] },
  { template: "Explore {nature_reserve}, then get ice cream at {ice_cream}", slots: ["nature_reserve", "ice_cream"] },
  // Education + Food
  { template: "Visit {museum}, then grab lunch at {cafe}", slots: ["museum", "cafe"] },
  { template: "Explore {art_gallery}, then have dinner at {restaurant}", slots: ["art_gallery", "restaurant"] },
  { template: "Browse books at {library}, then grab dinner at {restaurant}", slots: ["library", "restaurant"] },
  { template: "Have coffee at {cafe}, then explore {art_gallery}", slots: ["cafe", "art_gallery"] },
  // Entertainment + Food
  { template: "Catch a movie at {cinema}, then grab dinner at {restaurant}", slots: ["cinema", "restaurant"] },
  { template: "Go bowling at {bowling_alley}, then grab food at {fast_food}", slots: ["bowling_alley", "fast_food"] },
  { template: "Play mini golf at {miniature_golf}, then get ice cream at {ice_cream}", slots: ["miniature_golf", "ice_cream"] },
  { template: "Hit the arcade at {amusement_arcade}, then grab food at {fast_food}", slots: ["amusement_arcade", "fast_food"] },
  { template: "Go bowling at {bowling_alley}, then grab ice cream at {ice_cream}", slots: ["bowling_alley", "ice_cream"] },
  { template: "Catch a movie at {cinema}, then grab coffee at {cafe}", slots: ["cinema", "cafe"] },
  // Sports + Food
  { template: "Work out at {fitness_centre}, then refuel at {cafe}", slots: ["fitness_centre", "cafe"] },
  { template: "Work out at {fitness_centre}, then have dinner at {restaurant}", slots: ["fitness_centre", "restaurant"] },
  { template: "Go swimming at {swimming_pool}, then grab a bite at {cafe}", slots: ["swimming_pool", "cafe"] },
  { template: "Ice skate at {ice_rink}, then warm up at {cafe}", slots: ["ice_rink", "cafe"] },
  // Shopping combos
  { template: "Browse {mall}, then grab a bite at {fast_food}", slots: ["mall", "fast_food"] },
  { template: "Find some new reads at {books}, then have coffee at {cafe}", slots: ["books", "cafe"] },
  { template: "Browse {mall}, then catch a movie at {cinema}", slots: ["mall", "cinema"] },
  // Education + Outdoors
  { template: "Explore {art_gallery}, then stroll through {park}", slots: ["art_gallery", "park"] },
  { template: "Visit {museum}, then walk through {garden}", slots: ["museum", "garden"] },
  // Activity combos
  { template: "{activity}, then grab dinner at {restaurant}", slots: ["activity", "restaurant"] },
  { template: "{activity}, then grab coffee at {cafe}", slots: ["activity", "cafe"] },
  { template: "{activity}, then visit {museum}", slots: ["activity", "museum"] },
  { template: "Explore {art_gallery}, then {activity}", slots: ["art_gallery", "activity"] },
  { template: "Browse {mall}, then {activity}", slots: ["mall", "activity"] },
  { template: "{activity}, then grab ice cream at {ice_cream}", slots: ["activity", "ice_cream"] },
  { template: "{activity} and then {activity}", slots: ["activity", "activity"] },
  // Recipe combos
  { template: "Make {recipe} together, then take a walk at {park}", slots: ["recipe", "park"] },
  { template: "Make {recipe}, then {activity}", slots: ["recipe", "activity"] },
];

export const STANDARD_DATE_TEMPLATES: TemplateLike[] = STANDARD_DATE_TEMPLATE_DEFINITIONS.map(withCategories);

// ─── LONG (180+ min) ──────────────────────────────────────────────────────────

const LONG_DATE_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // Three Food/Outdoors/Activity combos
  { template: "Grab coffee at {cafe}, walk through {park}, then have dinner at {restaurant}", slots: ["cafe", "park", "restaurant"] },
  { template: "Walk through {park}, grab lunch at {cafe}, then {activity}", slots: ["park", "cafe", "activity"] },
  { template: "Stroll through {garden}, grab coffee at {cafe}, then explore {art_gallery}", slots: ["garden", "cafe", "art_gallery"] },
  { template: "Make {recipe}, then take a walk at {park}, then {activity}", slots: ["recipe", "park", "activity"] },
  { template: "Make {recipe}, {activity}, then grab dessert at {ice_cream}", slots: ["recipe", "activity", "ice_cream"] },
  // Education combos
  {
    template: "Explore {museum}, then browse {art_gallery}, then grab dinner at {restaurant}",
    slots: ["museum", "art_gallery", "restaurant"],
  },
  { template: "{activity}, then visit {museum}, then grab dinner at {restaurant}", slots: ["activity", "museum", "restaurant"] },
  { template: "Explore {museum}, grab lunch at {cafe}, then {activity}", slots: ["museum", "cafe", "activity"] },
  { template: "Explore {art_gallery}, grab coffee at {cafe}, then {activity}", slots: ["art_gallery", "cafe", "activity"] },
  // Entertainment combos
  { template: "Browse {mall}, catch a movie at {cinema}, then grab food at {fast_food}", slots: ["mall", "cinema", "fast_food"] },
  {
    template: "Go bowling at {bowling_alley}, grab dinner at {restaurant}, then take a walk at {park}",
    slots: ["bowling_alley", "restaurant", "park"],
  },
  {
    template: "Catch a movie at {cinema}, grab food at {restaurant}, then walk through {park}",
    slots: ["cinema", "restaurant", "park"],
  },
  {
    template: "Browse {mall}, grab lunch at {fast_food}, then play mini golf at {miniature_golf}",
    slots: ["mall", "fast_food", "miniature_golf"],
  },
  {
    template: "Go bowling at {bowling_alley}, grab dinner at {restaurant}, then catch a movie at {cinema}",
    slots: ["bowling_alley", "restaurant", "cinema"],
  },
  {
    template: "Have dinner at {restaurant}, then go bowling at {bowling_alley}, then grab ice cream at {ice_cream}",
    slots: ["restaurant", "bowling_alley", "ice_cream"],
  },
  // Sports combos
  {
    template: "Work out at {fitness_centre}, then {activity}, then grab dinner at {restaurant}",
    slots: ["fitness_centre", "activity", "restaurant"],
  },
  {
    template: "Work out at {fitness_centre}, get ice cream at {ice_cream}, then take a walk at {park}",
    slots: ["fitness_centre", "ice_cream", "park"],
  },
  { template: "Ice skate at {ice_rink}, grab food at {restaurant}, then {activity}", slots: ["ice_rink", "restaurant", "activity"] },
  // Shopping combos
  { template: "Explore {nature_reserve}, have lunch at {cafe}, then browse {mall}", slots: ["nature_reserve", "cafe", "mall"] },
  { template: "Find some new reads at {books}, grab coffee at {cafe}, then walk through {park}", slots: ["books", "cafe", "park"] },
  // Activity-heavy
  { template: "{activity}, then {activity}, then grab dinner at {restaurant}", slots: ["activity", "activity", "restaurant"] },
  { template: "{activity}, then {activity}, then {activity}", slots: ["activity", "activity", "activity"] },
  { template: "Walk through {park}, {activity}, then grab dinner at {restaurant}", slots: ["park", "activity", "restaurant"] },
  {
    template: "{activity}, explore {art_gallery}, then have dinner at {restaurant}, then a walk at {park}",
    slots: ["activity", "art_gallery", "restaurant", "park"],
  },
  // Four-slot full-day dates
  {
    template: "Grab coffee at {cafe}, stroll through {garden}, visit {museum}, then grab dinner at {restaurant}",
    slots: ["cafe", "garden", "museum", "restaurant"],
  },
  {
    template: "Stroll through {park}, explore {art_gallery}, grab coffee at {cafe}, then {activity}",
    slots: ["park", "art_gallery", "cafe", "activity"],
  },
  {
    template: "Make {recipe}, take a walk at {park}, browse {mall}, then grab coffee at {cafe}",
    slots: ["recipe", "park", "mall", "cafe"],
  },
  {
    template: "Visit {museum}, {activity}, walk through {park}, then grab coffee at {cafe}",
    slots: ["museum", "activity", "park", "cafe"],
  },
  {
    template: "Grab coffee at {cafe}, then {activity}, then hit the arcade at {amusement_arcade}, then grab food at {fast_food}",
    slots: ["cafe", "activity", "amusement_arcade", "fast_food"],
  },
  {
    template: "Find some new reads at {books}, grab coffee at {cafe}, play mini golf at {miniature_golf}, then get ice cream at {ice_cream}",
    slots: ["books", "cafe", "miniature_golf", "ice_cream"],
  },
];

export const LONG_DATE_TEMPLATES: TemplateLike[] = LONG_DATE_TEMPLATE_DEFINITIONS.map(withCategories);
