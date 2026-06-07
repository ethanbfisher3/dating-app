import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Text from "./AppText";
import IdeaPlaceLinks from "./IdeaPlaceLinks";
import type { PlaceSummary } from "../hooks/useDatePlannerIdeas";
import type { AppNavigation } from "../types/navigation";
import Ionicons from "@expo/vector-icons/Ionicons";

type CategoryConfig = { icon: string; color: string; bg: string; label: string };

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Food: { icon: "restaurant", color: "#d4522a", bg: "#fef0e8", label: "Food" },
  Sports: { icon: "barbell", color: "#16803c", bg: "#edfaf2", label: "Sports" },
  Outdoors: { icon: "leaf", color: "#0d7560", bg: "#e6f4f0", label: "Outdoors" },
  Education: { icon: "book", color: "#5746af", bg: "#eeebff", label: "Education" },
  Shopping: { icon: "bag-handle", color: "#b45309", bg: "#fef8e8", label: "Shopping" },
  Entertainment: { icon: "film", color: "#7c3aed", bg: "#f3eeff", label: "Entertainment" },
};

const DEFAULT_CONFIG: CategoryConfig = { icon: "heart", color: "#e63f67", bg: "#fff0f5", label: "Date" };

const SLOT_TO_CATEGORY: Record<string, string> = {
  restaurant: "Food",
  fast_food: "Food",
  cafe: "Food",
  food_court: "Food",
  ice_cream: "Food",
  recipe: "Food",
  dessert: "Food",
  meal: "Food",
  park: "Outdoors",
  garden: "Outdoors",
  nature_reserve: "Outdoors",
  recreation_ground: "Outdoors",
  dog_park: "Outdoors",
  viewpoint: "Outdoors",
  picnic_site: "Outdoors",
  camp_site: "Outdoors",
  pitch: "Outdoors",
  leisure: "Outdoors",
  sport: "Sports",
  tennis: "Sports",
  golf: "Sports",
  fitness: "Sports",
  yoga: "Sports",
  museum: "Education",
  art_gallery: "Education",
  library: "Education",
  historic: "Education",
  tourism: "Education",
  learningSpot: "Education",
  mall: "Shopping",
  shop: "Shopping",
  clothes: "Shopping",
  gift: "Shopping",
  toys: "Shopping",
  books: "Shopping",
  electronics: "Shopping",
  cinema: "Entertainment",
  amusement_arcade: "Entertainment",
  theme_park: "Entertainment",
  playground: "Entertainment",
  bowling_alley: "Entertainment",
  miniature_golf: "Entertainment",
  activityPlace: "Entertainment",
};

function getPrimaryCategory(schedule: Array<{ slot: string; place: PlaceSummary | null }>): string | null {
  const counts: Record<string, number> = {};

  for (const step of schedule) {
    const parts = step.slot.split("|").map((s) => s.trim());
    const sources = [...parts, step.place?.type ?? ""].filter(Boolean);

    for (const part of sources) {
      const cat = SLOT_TO_CATEGORY[part];
      if (cat) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}

type DateIdeaStep = {
  title: string;
  slot: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  place: PlaceSummary | null;
  travelToNextMinutes: number | null;
};

type DateIdeaCardProps = {
  index: number;
  titlePrefix?: string;
  filledTemplate: string;
  template?: string;
  schedule: DateIdeaStep[];
  places: PlaceSummary[];
  userLocation?: { latitude: number; longitude: number } | null;
  commuteToFirstMinutes?: number | null;
  commuteFromLastMinutes?: number | null;
  navigation: AppNavigation;
  recipeIndex?: number;
  onRecipePress?: (recipeIndex: number) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionColor?: string;
  onRegenerateStep?: (stepIndex: number) => void;
  isRegeneratingStep?: (stepIndex: number) => boolean;
};

export default function DateIdeaCard({
  index,
  titlePrefix = "Idea",
  filledTemplate,
  template,
  schedule,
  places,
  userLocation,
  commuteToFirstMinutes,
  commuteFromLastMinutes,
  navigation,
  recipeIndex,
  onRecipePress,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionColor = "#1e90ff",
  onRegenerateStep,
  isRegeneratingStep,
}: DateIdeaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryCategory = getPrimaryCategory(schedule);
  const categoryConfig = (primaryCategory ? CATEGORY_CONFIG[primaryCategory] : null) ?? DEFAULT_CONFIG;

  const toRadians = (value: number): number => (value * Math.PI) / 180;

  const getDistanceMilesFromUserLocation = (placeLocation: { latitude?: number; longitude?: number } | null | undefined): number | null => {
    if (
      !userLocation ||
      typeof userLocation.latitude !== "number" ||
      typeof userLocation.longitude !== "number" ||
      typeof placeLocation?.latitude !== "number" ||
      typeof placeLocation?.longitude !== "number"
    ) {
      return null;
    }

    const earthRadiusMiles = 3958.8;
    const dLat = toRadians(placeLocation.latitude - userLocation.latitude);
    const dLon = toRadians(placeLocation.longitude - userLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(userLocation.latitude)) * Math.cos(toRadians(placeLocation.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMiles * c;
  };

  const formatDistanceMiles = (distanceMiles: number | null): string => {
    if (distanceMiles === null) {
      return "Distance unavailable";
    }

    if (distanceMiles < 0.1) {
      return "< 0.1 mi away";
    }

    return `${distanceMiles.toFixed(1)} mi away`;
  };

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#dce6ef",
        padding: 16,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: categoryConfig.bg,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={categoryConfig.icon as any} size={24} color={categoryConfig.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                color: categoryConfig.color,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 1,
              }}
            >
              {categoryConfig.label}
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#1f2d3d",
              }}
            >
              {titlePrefix} {index + 1}
            </Text>
          </View>
        </View>

        {onPrimaryAction && primaryActionLabel ? (
          <TouchableOpacity
            onPress={onPrimaryAction}
            style={{
              backgroundColor: primaryActionColor,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#fff" }}>{primaryActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ marginTop: 12, gap: 5 }}>
        {schedule.map((step, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <Text style={{ color: categoryConfig.color, fontSize: 15, lineHeight: 22 }}>•</Text>
            <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: "#2c3e50" }}>{step.title}</Text>
          </View>
        ))}
      </View>

      {/* {__DEV__ && template ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 18,
            color: "#667788",
          }}
        >
          (DEV) Template: {template}
        </Text>
      ) : null} */}

      <TouchableOpacity onPress={() => setIsExpanded((prev) => !prev)} style={{ marginTop: 10, alignSelf: "flex-start" }}>
        <Text
          style={{
            fontSize: 14,
            color: "#1e90ff",
          }}
        >
          {isExpanded ? "▲ Hide details" : "▼ Show details"}
        </Text>
      </TouchableOpacity>

      {isExpanded && schedule.length ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 13, color: "#8899aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Schedule
          </Text>
          {(() => {
            type ScheduleRow =
              | { kind: "activity"; title: string; startTime: string; endTime: string; stepIndex: number }
              | { kind: "travel"; label: string; startTime?: string; endTime?: string; durationMinutes: number };

            const rows: ScheduleRow[] = [];

            if (commuteToFirstMinutes) {
              rows.push({ kind: "travel", label: "Drive to first stop", endTime: schedule[0]?.startTime, durationMinutes: commuteToFirstMinutes });
            }
            schedule.forEach((step, i) => {
              rows.push({ kind: "activity", title: step.title, startTime: step.startTime, endTime: step.endTime, stepIndex: i });
              if (step.travelToNextMinutes && i < schedule.length - 1) {
                rows.push({ kind: "travel", label: "Drive", startTime: step.endTime, endTime: schedule[i + 1]?.startTime, durationMinutes: step.travelToNextMinutes });
              }
            });
            if (commuteFromLastMinutes) {
              rows.push({ kind: "travel", label: "Drive home", startTime: schedule[schedule.length - 1]?.endTime, durationMinutes: commuteFromLastMinutes });
            }

            return rows.map((row, i) => {
              const isTravel = row.kind === "travel";
              const timeLabel = row.startTime && row.endTime
                ? `${row.startTime} – ${row.endTime}`
                : row.kind === "travel" ? `~${row.durationMinutes} min` : "";

              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 14, color: isTravel ? "#b0bec5" : categoryConfig.color, width: 10 }}>•</Text>
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 14, color: isTravel ? "#8899aa" : "#2c3e50" }}
                  >
                    {row.kind === "activity" ? row.title : row.label}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#8899aa" }}>{timeLabel}</Text>
                  {row.kind === "activity" && onRegenerateStep ? (
                    <TouchableOpacity
                      onPress={() => onRegenerateStep(row.stepIndex)}
                      disabled={isRegeneratingStep?.(row.stepIndex)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="refresh"
                        size={16}
                        color={isRegeneratingStep?.(row.stepIndex) ? "#ccc" : "#e63f67"}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            });
          })()}
        </View>
      ) : null}

      {isExpanded && typeof recipeIndex === "number" ? (
        <TouchableOpacity
          onPress={() => {
            if (onRecipePress) {
              onRecipePress(recipeIndex);
            } else {
              navigation.navigate("RecipeDetail", { index: recipeIndex });
            }
          }}
          style={{ marginTop: 8 }}
        >
          <Text
            style={{
              fontSize: 15,
              color: "#1e90ff",
              textDecorationLine: "underline",
            }}
          >
            View recipe details
          </Text>
        </TouchableOpacity>
      ) : null}

      {isExpanded && places.length ? <IdeaPlaceLinks places={places} navigation={navigation} /> : null}
    </View>
  );
}
