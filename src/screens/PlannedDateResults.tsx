import React from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { AppScreenProps } from "../types/navigation";
import useDatePlannerIdeas from "../hooks/useDatePlannerIdeas";

export default function PlannedDateResults({
  route,
}: AppScreenProps<"PlannedDateResults">) {
  const {
    selectedDate,
    startHour,
    endHour,
    maxPrice,
    maxDistance,
    hasStarvingStudentCard,
    categories,
  } = route.params;

  const { ideas, totalMatches, sourceFile, isLoading, error, refetch } =
    useDatePlannerIdeas(route.params);

  const formatHour = (hour24: number) => {
    const normalized = ((hour24 % 24) + 24) % 24;
    const period = normalized < 12 ? "AM" : "PM";
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}:00 ${period}`;
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingTop: 0,
        backgroundColor: "#fafbfc",
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 36,
          marginVertical: 24,
          color: "#1a1a1a",
        }}
      >
        Results
      </Text>

      <Text
        style={{
          marginBottom: 16,
          fontSize: 17,
          lineHeight: 26,
          color: "#555",
        }}
      >
        Here are 10 generated date templates based on your categories, date, and
        time window.
      </Text>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#dce6ef",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "800",
            color: "#1f2d3d",
            marginBottom: 8,
          }}
        >
          Your Inputs
        </Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
          Date: {selectedDate}
        </Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
          Time: {formatHour(startHour)} - {formatHour(endHour)}
        </Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
          Budget: ${maxPrice}
        </Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
          Distance: {maxDistance} miles
        </Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
          Starving Student Card: {hasStarvingStudentCard ? "Yes" : "No"}
        </Text>
        <Text style={{ color: "#4b5b6b" }}>
          Categories: {categories.join(", ")}
        </Text>
      </View>

      <TouchableOpacity
        onPress={refetch}
        disabled={isLoading}
        style={{
          backgroundColor: "#28a745",
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: "center",
          marginBottom: 16,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          Regenerate
        </Text>
      </TouchableOpacity>

      <Text style={{ marginBottom: 16, fontSize: 15, color: "#4b5b6b" }}>
        Matching open places: {totalMatches}
      </Text>

      {sourceFile ? (
        <Text style={{ marginBottom: 16, fontSize: 13, color: "#7a8a99" }}>
          Source: {sourceFile}
        </Text>
      ) : null}

      {isLoading ? (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={{ marginTop: 12, color: "#555", fontSize: 16 }}>
            Building your date ideas...
          </Text>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#e56b6f",
            borderRadius: 12,
            backgroundColor: "#fff5f5",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#9b2226", fontSize: 15, marginBottom: 10 }}>
            Could not load date ideas.
          </Text>
          <Text style={{ color: "#9b2226", fontSize: 13, marginBottom: 12 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={{
              backgroundColor: "#1e90ff",
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !error
        ? ideas.map((idea, index) => {
            const places = Object.values(idea.places || {}).filter(Boolean);
            const schedule = idea.schedule || [];

            return (
              <View
                key={`${idea.filledTemplate}-${index}`}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#dce6ef",
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "800", color: "#1f2d3d" }}
                >
                  Idea {index + 1}
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 17,
                    lineHeight: 26,
                    color: "#2c3e50",
                    fontWeight: "600",
                  }}
                >
                  {idea.filledTemplate}
                </Text>

                {schedule.length ? (
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
                    {schedule.map((step, stepIndex) => (
                      <View
                        key={`${step.startTime}-${step.endTime}-${stepIndex}`}
                        style={{
                          marginBottom: 10,
                          padding: 10,
                          borderRadius: 8,
                          backgroundColor: "#f5f8fb",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: "#2c3e50",
                            marginBottom: 4,
                          }}
                        >
                          {step.startTime} - {step.endTime} (
                          {step.durationMinutes} min)
                        </Text>
                        <Text style={{ fontSize: 14, color: "#2c3e50" }}>
                          {step.title}
                        </Text>
                        {step.place?.googleMapsUri ? (
                          <TouchableOpacity
                            style={{ marginTop: 4 }}
                            onPress={() =>
                              Linking.openURL(step.place!.googleMapsUri)
                            }
                          >
                            <Text
                              style={{
                                color: "#1e90ff",
                                fontWeight: "700",
                                textDecorationLine: "underline",
                              }}
                            >
                              {step.place.name}
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {step.travelToNextMinutes !== null ? (
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

                        {stepIndex === schedule.length - 1 &&
                        idea.commuteFromLastMinutes !== null &&
                        idea.commuteFromLastMinutes !== undefined ? (
                          <Text
                            style={{
                              marginTop: 6,
                              color: "#556677",
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            Travel from this place back home: ~
                            {idea.commuteFromLastMinutes} min
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {places.length ? (
                  <View style={{ marginTop: 12 }}>
                    {places.map((place, placeIndex) => {
                      if (!place) {
                        return null;
                      }

                      return (
                        <TouchableOpacity
                          key={`${place.id}-${placeIndex}`}
                          style={{ marginBottom: 10 }}
                          disabled={!place.googleMapsUri}
                          onPress={() => {
                            if (place.googleMapsUri) {
                              Linking.openURL(place.googleMapsUri);
                            }
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              color: "#1e90ff",
                              textDecorationLine: place.googleMapsUri
                                ? "underline"
                                : "none",
                              fontWeight: "700",
                            }}
                          >
                            {place.name}
                          </Text>
                          {place.address ? (
                            <Text style={{ color: "#667788", marginTop: 2 }}>
                              {place.address}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })
        : null}
    </ScrollView>
  );
}
