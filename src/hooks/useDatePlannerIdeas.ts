import { useCallback, useEffect, useMemo, useState } from "react";
import { NativeModules, Platform } from "react-native";
import type { PlannedDateResultsParams } from "../types/navigation";
import {
  generateDatePlannerIdeasFromPlaces,
  type PlannerPlace,
} from "../../shared/datePlannerEngine";

type PlaceSummary = {
  id: string;
  name: string;
  address: string;
  types: string[];
  googleMapsUri: string;
  rating: number | null;
  location?: {
    latitude: number | null;
    longitude: number | null;
  };
};

type FilledIdea = {
  template: string;
  filledTemplate: string;
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
  ideas: FilledIdea[];
  sourceFile: string;
};

function loadLocalPlacesData(): PlannerPlace[] | null {
  try {
    const localJson = require("../data/places/places.json");
    const data = localJson?.default ?? localJson;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
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
          places: localPlaces,
          request: {
            categories: params.categories,
            date: toIsoDate(params.selectedDate),
            startHour: params.startHour,
            endHour: params.endHour,
            ideaCount: 10,
            userLatitude: params.userLocation?.latitude,
            userLongitude: params.userLocation?.longitude,
          },
          sourceFile: "src/data/places/places.json",
        });
        setIdeas(Array.isArray(localData.ideas) ? localData.ideas : []);
        setTotalMatches(
          typeof localData.totalMatches === "number"
            ? localData.totalMatches
            : 0,
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

      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
      setTotalMatches(
        typeof data.totalMatches === "number" ? data.totalMatches : 0,
      );
      setSourceFile(typeof data.sourceFile === "string" ? data.sourceFile : "");
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch date planner ideas.");
      setIdeas([]);
      setTotalMatches(0);
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
    sourceFile,
    isLoading,
    error,
    refetch: fetchIdeas,
  };
}
