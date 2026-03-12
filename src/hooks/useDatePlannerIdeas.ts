import { useCallback, useEffect, useMemo, useState } from "react";
import { NativeModules, Platform } from "react-native";
import type { PlannedDateResultsParams } from "../types/navigation";
import {
  convertActivitiesToPlannerPlaces,
  generateDatePlannerIdeasFromPlaces,
  type PlannerPlace,
} from "../../shared/datePlannerEngine";
import activities from "../data/activities";
import recipes from "../data/Recipes";

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

export type FilledIdea = {
  template: string;
  filledTemplate: string;
  recipeIndex?: number;
  commuteToFirstMinutes?: number | null;
  commuteFromLastMinutes?: number | null;
  places: Record<string, PlaceSummary | null>;
  schedule?: Array<{
    title: string;
    slot: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    place: PlaceSummary | null;
    travelToNextMinutes: number | null;
  }>;
};

type DatePlannerApiResponse = {
  totalMatches: number;
  matchedPlaces?: PlaceSummary[];
  ideas: FilledIdea[];
  sourceFile: string;
};

const RECIPE_PLACEHOLDER = "{recipe}";

const AT_HOME_ACTIVITIES = [
  "play Board/Card games",
  "play Video Games",
  "have a movie night",
  "do a puzzle challenge",
  "do a DIY craft night",
  "do karaoke at home",
  "have an at-home spa night",
  "bake a dessert together",
];

function replaceRecipePlaceholder(text: string, recipeName: string): string {
  return text.split(RECIPE_PLACEHOLDER).join(recipeName);
}

function applyRecipeTemplates(
  ideas: FilledIdea[],
  params: PlannedDateResultsParams,
): FilledIdea[] {
  const includesFood = params.categories.includes("Food");
  const budget =
    typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)
      ? params.maxPrice
      : Number.POSITIVE_INFINITY;

  const affordableRecipes = recipes.filter(
    (recipe) =>
      typeof recipe.estimatedPrice === "number" &&
      recipe.estimatedPrice <= budget,
  );

  return ideas.flatMap((idea, index) => {
    const usesRecipe =
      idea.template.includes(RECIPE_PLACEHOLDER) ||
      idea.filledTemplate.includes(RECIPE_PLACEHOLDER);

    if (!usesRecipe) {
      return [idea];
    }

    if (!includesFood || affordableRecipes.length === 0) {
      return [];
    }

    const selectedRecipe = affordableRecipes[index % affordableRecipes.length];
    const selectedRecipeIndex = recipes.findIndex(
      (recipe) => recipe.name === selectedRecipe.name,
    );

    return [
      {
        ...idea,
        template: replaceRecipePlaceholder(idea.template, selectedRecipe.name),
        filledTemplate: replaceRecipePlaceholder(
          idea.filledTemplate,
          selectedRecipe.name,
        ),
        recipeIndex: selectedRecipeIndex >= 0 ? selectedRecipeIndex : undefined,
      },
    ];
  });
}

function buildAtHomeIdeas(params: PlannedDateResultsParams): FilledIdea[] {
  if (params.maxDistance > 0) {
    return [];
  }

  const budget =
    typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)
      ? params.maxPrice
      : Number.POSITIVE_INFINITY;

  const affordableRecipes = recipes.filter(
    (recipe) =>
      typeof recipe.estimatedPrice === "number" &&
      recipe.estimatedPrice <= budget,
  );

  const cookingIdeas = affordableRecipes.slice(0, 6).map((recipe, index) => {
    const activity = AT_HOME_ACTIVITIES[index % AT_HOME_ACTIVITIES.length];
    const recipeIndex = recipes.findIndex(
      (candidate) => candidate.name === recipe.name,
    );

    return {
      template: `Cook ${recipe.name} at home and then ${activity}`,
      filledTemplate: `Cook ${recipe.name} at home and then ${activity}`,
      recipeIndex: recipeIndex >= 0 ? recipeIndex : undefined,
      commuteToFirstMinutes: 0,
      commuteFromLastMinutes: 0,
      places: {},
      schedule: [],
    };
  });

  const atHomeOnlyActivities = AT_HOME_ACTIVITIES.map((activity) => ({
    template: `Stay in and ${activity}`,
    filledTemplate: `Stay in and ${activity}`,
    commuteToFirstMinutes: 0,
    commuteFromLastMinutes: 0,
    places: {},
    schedule: [],
  }));

  return [...cookingIdeas, ...atHomeOnlyActivities];
}

function applyNoTravelIdeas(
  ideas: FilledIdea[],
  params: PlannedDateResultsParams,
): FilledIdea[] {
  if (params.maxDistance > 0) {
    return ideas;
  }

  const noTravelIdeas = buildAtHomeIdeas(params);
  if (!noTravelIdeas.length) {
    return ideas;
  }

  const merged = [...noTravelIdeas, ...ideas];
  const deduped: FilledIdea[] = [];
  const seen = new Set<string>();

  for (const idea of merged) {
    const key = `${idea.template}__${idea.filledTemplate}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(idea);
  }

  return deduped.slice(0, 10);
}

function ensureSourceKind(place: PlaceSummary | null): PlaceSummary | null {
  if (!place) {
    return null;
  }

  return {
    ...place,
    sourceKind: place.sourceKind || "place",
  };
}

function normalizeIdeasSourceKinds(ideas: FilledIdea[]): FilledIdea[] {
  return ideas.map((idea) => {
    const normalizedPlaces = Object.fromEntries(
      Object.entries(idea.places || {}).map(([slot, place]) => [
        slot,
        ensureSourceKind(place),
      ]),
    ) as Record<string, PlaceSummary | null>;

    const normalizedSchedule = (idea.schedule || []).map((step) => ({
      ...step,
      place: ensureSourceKind(step.place),
    }));

    return {
      ...idea,
      places: normalizedPlaces,
      schedule: normalizedSchedule,
    };
  });
}

function normalizeMatchedPlaces(items: PlaceSummary[]): PlaceSummary[] {
  return (items || []).map((item) => ({
    ...item,
    sourceKind: item.sourceKind || "place",
  }));
}

function appendMatchingRecipes(
  matchedPlaces: PlaceSummary[],
  params: PlannedDateResultsParams,
): PlaceSummary[] {
  const next = [...matchedPlaces];
  const seenIds = new Set(next.map((item) => item.id));

  if (!params.categories.includes("Food")) {
    return next;
  }

  const budget =
    typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)
      ? params.maxPrice
      : Number.POSITIVE_INFINITY;
  const totalMinutes = computeWindowDurationMinutes(
    params.startHour,
    params.endHour,
  );

  const matchingRecipes = recipes.filter(
    (recipe) =>
      typeof recipe.estimatedPrice === "number" &&
      recipe.estimatedPrice <= budget &&
      typeof recipe.estimatedTime === "number" &&
      recipe.estimatedTime <= totalMinutes,
  );

  for (const recipe of matchingRecipes) {
    const recipeIndex = recipes.findIndex(
      (candidate) => candidate.name === recipe.name,
    );
    if (recipeIndex === -1) {
      continue;
    }

    const recipeId = `recipe_${recipeIndex}`;
    if (seenIds.has(recipeId)) {
      continue;
    }

    seenIds.add(recipeId);
    next.push({
      id: recipeId,
      name: recipe.name,
      address: "",
      types: ["recipe"],
      googleMapsUri: "",
      rating: null,
      sourceKind: "recipe",
      location: {
        latitude: null,
        longitude: null,
      },
    });
  }

  return next;
}

function computeWindowDurationMinutes(startHour: number, endHour: number) {
  const start = startHour * 60;
  let end = endHour * 60;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function prependCuratedIdeas(
  ideas: FilledIdea[],
  matchedPlaces: PlaceSummary[],
  params: PlannedDateResultsParams,
): FilledIdea[] {
  const totalMinutes = computeWindowDurationMinutes(
    params.startHour,
    params.endHour,
  );
  const budget =
    typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)
      ? params.maxPrice
      : Number.POSITIVE_INFINITY;

  const curatedActivityIdeas = matchedPlaces
    .filter((item) => item.sourceKind === "activity")
    .slice(0, 3)
    .map((activity) => ({
      template: `${activity.name}`,
      filledTemplate: `${activity.name}`,
      commuteToFirstMinutes: 0,
      commuteFromLastMinutes: 0,
      places: {
        activity,
      },
      schedule: [],
    }));

  const curatedRecipeIdeas =
    params.categories.includes("Food") && totalMinutes > 0
      ? recipes
          .filter(
            (recipe) =>
              typeof recipe.estimatedPrice === "number" &&
              recipe.estimatedPrice <= budget &&
              typeof recipe.estimatedTime === "number" &&
              recipe.estimatedTime <= totalMinutes,
          )
          .slice(0, 4)
          .map((recipe) => {
            const recipeIndex = recipes.findIndex(
              (candidate) => candidate.name === recipe.name,
            );
            return {
              template: `Cook ${recipe.name} together at home`,
              filledTemplate: `Cook ${recipe.name} together at home`,
              recipeIndex: recipeIndex >= 0 ? recipeIndex : undefined,
              commuteToFirstMinutes: 0,
              commuteFromLastMinutes: 0,
              places: {},
              schedule: [],
            };
          })
      : [];

  const merged = [...curatedActivityIdeas, ...curatedRecipeIdeas, ...ideas];
  const deduped: FilledIdea[] = [];
  const seen = new Set<string>();

  for (const idea of merged) {
    const key = `${idea.template}__${idea.filledTemplate}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(idea);
  }

  return deduped.slice(0, 10);
}

function loadLocalPlacesData(): PlannerPlace[] | null {
  try {
    const localJson = require("../data/places/places.json");
    const data = localJson?.default ?? localJson;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function buildPlannerCandidates(places: PlannerPlace[]): PlannerPlace[] {
  return [...places, ...convertActivitiesToPlannerPlaces(activities)];
}

function getCandidateBaseUrls(): string[] {
  const urls = new Set<string>();

  const envBaseUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  if (envBaseUrl) {
    urls.add(envBaseUrl.replace(/\/$/, ""));
  }

  urls.add("http://10.25.102.45:3000");

  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  const serverHost = (NativeModules as any)?.PlatformConstants?.ServerHost as
    | string
    | undefined;
  let hostFromBundler = "";

  if (serverHost) {
    const cleanedServerHost = serverHost.split(":")[0];
    if (cleanedServerHost) {
      urls.add(`http://${cleanedServerHost}:3000`);
    }
  }

  if (scriptURL) {
    try {
      const parsed = new URL(scriptURL);
      hostFromBundler = parsed.hostname || "";
    } catch {
      const cleaned = scriptURL.replace(/^[a-zA-Z]+:\/\//, "");
      hostFromBundler = cleaned.split("/")[0].split(":")[0] || "";
    }
  }

  if (hostFromBundler) {
    urls.add(`http://${hostFromBundler}:3000`);
  }

  urls.add("http://localhost:3000");
  urls.add("http://127.0.0.1:3000");

  if (Platform.OS === "android") {
    urls.add("http://10.0.2.2:3000");
  }

  return Array.from(urls);
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

export default function useDatePlannerIdeas(params: PlannedDateResultsParams) {
  const [ideas, setIdeas] = useState<FilledIdea[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matchedPlaces, setMatchedPlaces] = useState<PlaceSummary[]>([]);
  const [sourceFile, setSourceFile] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const query = new URLSearchParams({
      categories: params.categories.join(","),
      date: toIsoDate(params.selectedDate),
      startHour: String(params.startHour),
      endHour: String(params.endHour),
      ideaCount: "10",
      maxPrice: String(params.maxPrice),
      maxDistanceMiles: String(params.maxDistance),
    });

    if (params.userLocation?.latitude && params.userLocation?.longitude) {
      query.set("userLatitude", String(params.userLocation.latitude));
      query.set("userLongitude", String(params.userLocation.longitude));
    }

    return query.toString();
  }, [
    params.categories,
    params.selectedDate,
    params.startHour,
    params.endHour,
    params.maxPrice,
    params.maxDistance,
    params.userLocation?.latitude,
    params.userLocation?.longitude,
  ]);

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const localPlaces = loadLocalPlacesData();
      if (localPlaces && localPlaces.length) {
        const localData = generateDatePlannerIdeasFromPlaces({
          places: buildPlannerCandidates(localPlaces),
          request: {
            categories: params.categories,
            date: toIsoDate(params.selectedDate),
            startHour: params.startHour,
            endHour: params.endHour,
            ideaCount: 10,
            maxPrice: params.maxPrice,
            maxDistanceMiles: params.maxDistance,
            userLatitude: params.userLocation?.latitude,
            userLongitude: params.userLocation?.longitude,
          },
          sourceFile: "src/data/places/places.json",
        });
        const rawIdeas = Array.isArray(localData.ideas) ? localData.ideas : [];
        const normalizedRawIdeas = normalizeIdeasSourceKinds(rawIdeas);
        const recipeProcessedIdeas = applyRecipeTemplates(
          normalizedRawIdeas,
          params,
        );
        const normalizedMatchedPlaces = normalizeMatchedPlaces(
          Array.isArray(localData.matchedPlaces) ? localData.matchedPlaces : [],
        );
        const noTravelIdeas = applyNoTravelIdeas(recipeProcessedIdeas, params);
        const finalIdeas = prependCuratedIdeas(
          noTravelIdeas,
          normalizedMatchedPlaces,
          params,
        );
        setIdeas(finalIdeas);
        setTotalMatches(
          typeof localData.totalMatches === "number"
            ? localData.totalMatches
            : 0,
        );
        setMatchedPlaces(
          appendMatchingRecipes(normalizedMatchedPlaces, params),
        );
        setSourceFile(
          typeof localData.sourceFile === "string" ? localData.sourceFile : "",
        );
        return;
      }

      const baseUrls = getCandidateBaseUrls();
      let data: DatePlannerApiResponse | null = null;
      let lastErrorMessage = "Failed to fetch date planner ideas.";
      const attemptedUrls: string[] = [];

      for (const baseUrl of baseUrls) {
        try {
          attemptedUrls.push(baseUrl);
          const response = await fetch(
            `${baseUrl}/date-planner/ideas?${queryString}`,
          );

          if (!response.ok) {
            const errorBody = await response.text();
            lastErrorMessage =
              errorBody || `Server responded with status ${response.status}.`;
            continue;
          }

          data = (await response.json()) as DatePlannerApiResponse;
          break;
        } catch (networkError: any) {
          lastErrorMessage =
            networkError?.message || "Network error while fetching ideas.";
        }
      }

      if (!data) {
        throw new Error(
          `${lastErrorMessage} Tried: ${attemptedUrls.join(", ")}. Make sure the server is running with \"npm run server\" and your phone/emulator can reach port 3000.`,
        );
      }

      const rawIdeas = Array.isArray(data.ideas) ? data.ideas : [];
      const normalizedRawIdeas = normalizeIdeasSourceKinds(rawIdeas);
      const recipeProcessedIdeas = applyRecipeTemplates(
        normalizedRawIdeas,
        params,
      );
      const normalizedMatchedPlaces = normalizeMatchedPlaces(
        Array.isArray(data.matchedPlaces) ? data.matchedPlaces : [],
      );
      const noTravelIdeas = applyNoTravelIdeas(recipeProcessedIdeas, params);
      const finalIdeas = prependCuratedIdeas(
        noTravelIdeas,
        normalizedMatchedPlaces,
        params,
      );
      setIdeas(finalIdeas);
      setTotalMatches(
        typeof data.totalMatches === "number" ? data.totalMatches : 0,
      );
      setMatchedPlaces(appendMatchingRecipes(normalizedMatchedPlaces, params));
      setSourceFile(typeof data.sourceFile === "string" ? data.sourceFile : "");
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch date planner ideas.");
      setIdeas([]);
      setTotalMatches(0);
      setMatchedPlaces([]);
      setSourceFile("");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  return {
    ideas,
    totalMatches,
    matchedPlaces,
    sourceFile,
    isLoading,
    error,
    refetch: fetchIdeas,
  };
}
