import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import IdeaPlaceLinks from "./IdeaPlaceLinks";
import type { PlaceSummary } from "../hooks/useDatePlannerIdeas";
import type { AppNavigation } from "../types/navigation";

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

  const toRadians = (value: number): number => (value * Math.PI) / 180;

  const getDistanceMilesFromUserLocation = (
    placeLocation: { latitude?: number; longitude?: number } | null | undefined,
  ): number | null => {
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#1f2d3d",
            }}
          >
            {titlePrefix} {index + 1}
          </Text>
        </View>

        {onPrimaryAction && primaryActionLabel ? (
          <TouchableOpacity
            onPress={onPrimaryAction}
            style={{
              alignSelf: "flex-end",
              backgroundColor: primaryActionColor,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>{primaryActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text
        style={{
          marginTop: 8,
          fontSize: 17,
          lineHeight: 26,
          color: "#2c3e50",
          fontWeight: "600",
        }}
      >
        {filledTemplate}
      </Text>

      {__DEV__ && template ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 18,
            color: "#667788",
            fontWeight: "600",
          }}
        >
          (DEV) Template: {template}
        </Text>
      ) : null}

      <TouchableOpacity onPress={() => setIsExpanded((prev) => !prev)} style={{ marginTop: 10, alignSelf: "flex-start" }}>
        <Text
          style={{
            fontSize: 14,
            color: "#1e90ff",
            fontWeight: "700",
          }}
        >
          {isExpanded ? "▲ Hide details" : "▼ Show details"}
        </Text>
      </TouchableOpacity>

      {isExpanded && schedule.length ? (
        <View style={{ marginTop: 12 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: "#1f2d3d",
              marginBottom: 8,
            }}
          >
            Schedule
          </Text>
          {commuteToFirstMinutes !== null && commuteToFirstMinutes !== 0 ? (
            <View
              style={{
                marginBottom: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: "#f5f8fb",
              }}
            >
              <Text
                style={{
                  // marginBottom: 4,
                  color: "#556677",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Travel to first stop: ~{commuteToFirstMinutes} min
              </Text>
            </View>
          ) : null}
          {schedule.map((step, stepIndex) => (
            <View key={`${step.startTime}-${step.endTime}-${stepIndex}`}>
              <View
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#f5f8fb",
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ maxWidth: onRegenerateStep ? "70%" : "100%" }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#2c3e50",
                        marginBottom: 4,
                      }}
                    >
                      {step.startTime} - {step.endTime} ({step.durationMinutes} min)
                    </Text>
                    <Text style={{ fontSize: 14, color: "#2c3e50" }}>{step.title}</Text>
                    {__DEV__ && step.place ? (
                      <Text style={{ marginTop: 4, fontSize: 12, color: "#667788", fontWeight: "600" }}>
                        (DEV) {step.place.type} • {formatDistanceMiles(getDistanceMilesFromUserLocation(step.place.location))}
                      </Text>
                    ) : null}

                    {step.travelToNextMinutes !== null && step.travelToNextMinutes !== 0 ? (
                      <Text
                        style={{
                          marginTop: 6,
                          color: "#556677",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        Travel to next stop: ~{step.travelToNextMinutes} min
                      </Text>
                    ) : null}
                  </View>

                  {onRegenerateStep ? (
                    <TouchableOpacity
                      onPress={() => onRegenerateStep(stepIndex)}
                      disabled={isRegeneratingStep?.(stepIndex)}
                      style={{
                        backgroundColor: isRegeneratingStep?.(stepIndex) ? "#ccc" : "#e63f67",
                        borderRadius: 6,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {isRegeneratingStep?.(stepIndex) ? "Loading..." : "Regenerate"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {stepIndex === schedule.length - 1 && commuteFromLastMinutes !== null && commuteFromLastMinutes !== 0 ? (
                <View
                  style={{
                    marginBottom: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: "#f5f8fb",
                  }}
                >
                  <Text
                    style={{
                      // marginTop: 6,
                      color: "#556677",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Travel from this place back home: ~{commuteFromLastMinutes} min
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
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
              fontWeight: "700",
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
