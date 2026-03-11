import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type {
  AppScreenProps,
  PlannedDateResultsParams,
} from "../types/navigation";
import useDatePlannerIdeas from "../hooks/useDatePlannerIdeas";
import { saveDateIdea } from "../data/savedIdeasStore";

const DATE_CATEGORIES = [
  "Food",
  "Outdoors",
  "Sports",
  "Nature",
  "Learning",
  "Shopping",
  "Recreation",
];

export default function PlannedDateResults({
  route,
  navigation,
}: AppScreenProps<"PlannedDateResults">) {
  const [plannerParams, setPlannerParams] = useState<PlannedDateResultsParams>(
    route.params,
  );
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draftSelectedDate, setDraftSelectedDate] = useState(
    route.params.selectedDate,
  );
  const initialStartHour24 = ((route.params.startHour % 24) + 24) % 24;
  const initialEndHour24 = ((route.params.endHour % 24) + 24) % 24;
  const [draftStartHour12, setDraftStartHour12] = useState(
    String(initialStartHour24 % 12 === 0 ? 12 : initialStartHour24 % 12),
  );
  const [draftStartPeriod, setDraftStartPeriod] = useState<"AM" | "PM">(
    initialStartHour24 < 12 ? "AM" : "PM",
  );
  const [draftEndHour12, setDraftEndHour12] = useState(
    String(initialEndHour24 % 12 === 0 ? 12 : initialEndHour24 % 12),
  );
  const [draftEndPeriod, setDraftEndPeriod] = useState<"AM" | "PM">(
    initialEndHour24 < 12 ? "AM" : "PM",
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState(
    String(route.params.maxPrice),
  );
  const [draftMaxDistance, setDraftMaxDistance] = useState(
    String(route.params.maxDistance),
  );
  const [draftHasStarvingStudentCard, setDraftHasStarvingStudentCard] =
    useState(route.params.hasStarvingStudentCard);
  const [draftCategoriesChecked, setDraftCategoriesChecked] = useState(
    DATE_CATEGORIES.map((category) =>
      route.params.categories.includes(category),
    ),
  );

  const { ideas, totalMatches, sourceFile, isLoading, error, refetch } =
    useDatePlannerIdeas(plannerParams);

  const {
    selectedDate,
    startHour,
    endHour,
    maxPrice,
    maxDistance,
    hasStarvingStudentCard,
    categories,
  } = plannerParams;

  const formatHour = (hour24: number) => {
    const normalized = ((hour24 % 24) + 24) % 24;
    const period = normalized < 12 ? "AM" : "PM";
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}:00 ${period}`;
  };

  const clampHour12 = (value: number) => {
    if (Number.isNaN(value)) return 1;
    if (value < 1) return 1;
    if (value > 12) return 12;
    return value;
  };

  const convertTo24Hour = (hour12: number, period: "AM" | "PM") => {
    if (period === "AM") {
      return hour12 === 12 ? 0 : hour12;
    }
    return hour12 === 12 ? 12 : hour12 + 12;
  };

  const toggleDraftCategory = (index: number) => {
    setDraftCategoriesChecked((current) => {
      const updated = [...current];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const openEditModal = () => {
    const startHour24 = ((plannerParams.startHour % 24) + 24) % 24;
    const endHour24 = ((plannerParams.endHour % 24) + 24) % 24;

    setDraftSelectedDate(plannerParams.selectedDate);
    setDraftStartHour12(String(startHour24 % 12 === 0 ? 12 : startHour24 % 12));
    setDraftStartPeriod(startHour24 < 12 ? "AM" : "PM");
    setDraftEndHour12(String(endHour24 % 12 === 0 ? 12 : endHour24 % 12));
    setDraftEndPeriod(endHour24 < 12 ? "AM" : "PM");
    setDraftMaxPrice(String(plannerParams.maxPrice));
    setDraftMaxDistance(String(plannerParams.maxDistance));
    setDraftHasStarvingStudentCard(plannerParams.hasStarvingStudentCard);
    setDraftCategoriesChecked(
      DATE_CATEGORIES.map((category) =>
        plannerParams.categories.includes(category),
      ),
    );
    setShowEditDatePicker(false);
    setEditError(null);
    setIsEditModalVisible(true);
  };

  const applyEditsAndRegenerate = () => {
    const nextStartHour12 = Number.parseInt(draftStartHour12, 10);
    const nextEndHour12 = Number.parseInt(draftEndHour12, 10);
    const nextMaxPrice = Number.parseInt(draftMaxPrice, 10);
    const nextMaxDistance = Number.parseInt(draftMaxDistance, 10);
    const nextCategories = DATE_CATEGORIES.filter(
      (_, index) => draftCategoriesChecked[index],
    );

    if (!/^\d{4}-\d{2}-\d{2}$/.test(draftSelectedDate)) {
      setEditError("Date must be in YYYY-MM-DD format.");
      return;
    }

    if (Number.isNaN(nextStartHour12) || Number.isNaN(nextEndHour12)) {
      setEditError("Start and end hours are required.");
      return;
    }

    if (
      clampHour12(nextStartHour12) !== nextStartHour12 ||
      clampHour12(nextEndHour12) !== nextEndHour12
    ) {
      setEditError("Start and end hours must be between 1 and 12.");
      return;
    }

    if (Number.isNaN(nextMaxPrice) || nextMaxPrice < 0) {
      setEditError("Budget must be a non-negative number.");
      return;
    }

    if (Number.isNaN(nextMaxDistance) || nextMaxDistance < 0) {
      setEditError("Distance must be a non-negative number.");
      return;
    }

    if (!nextCategories.length) {
      setEditError("Add at least one category.");
      return;
    }

    setPlannerParams({
      selectedDate: draftSelectedDate,
      startHour: convertTo24Hour(nextStartHour12, draftStartPeriod),
      endHour: convertTo24Hour(nextEndHour12, draftEndPeriod),
      maxPrice: nextMaxPrice,
      maxDistance: nextMaxDistance,
      hasStarvingStudentCard: draftHasStarvingStudentCard,
      categories: nextCategories,
      userLocation: plannerParams.userLocation ?? null,
    });
    setIsEditModalVisible(false);
    setEditError(null);
  };

  const draftDateValue = (() => {
    const parsed = new Date(`${draftSelectedDate}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  })();

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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: "#1f2d3d",
            }}
          >
            Your Inputs
          </Text>
          <TouchableOpacity
            onPress={openEditModal}
            style={{
              backgroundColor: "#1e90ff",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Edit</Text>
          </TouchableOpacity>
        </View>
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

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowEditDatePicker(false);
          setIsEditModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#dce6ef",
              maxHeight: "88%",
              overflow: "hidden",
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator
              contentContainerStyle={{ padding: 16 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#1f2d3d",
                  marginBottom: 12,
                }}
              >
                Edit Inputs
              </Text>

              <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowEditDatePicker(true)}
                style={{
                  padding: 12,
                  borderWidth: 2,
                  borderColor: "#1e90ff",
                  borderRadius: 10,
                  marginBottom: 10,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, color: "#1a1a1a" }}>
                  {draftSelectedDate}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  marginVertical: 8,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2c3e50",
                }}
              >{`${draftStartHour12} ${draftStartPeriod} - ${draftEndHour12} ${draftEndPeriod}`}</Text>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: 6,
                    }}
                  >
                    Start Time
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: 2,
                        borderColor: "#1e90ff",
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 18,
                        backgroundColor: "#fff",
                        textAlign: "center",
                      }}
                      keyboardType="numeric"
                      value={draftStartHour12}
                      onChangeText={(text) => {
                        if (text.trim() === "") {
                          setDraftStartHour12("");
                          return;
                        }

                        const parsed = parseInt(text, 10);
                        if (Number.isNaN(parsed)) {
                          setDraftStartHour12("");
                          return;
                        }

                        setDraftStartHour12(String(clampHour12(parsed)));
                      }}
                      placeholder="1-12"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setDraftStartPeriod(
                          draftStartPeriod === "AM" ? "PM" : "AM",
                        )
                      }
                      style={{
                        width: 60,
                        borderWidth: 2,
                        borderColor: "#1e90ff",
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor:
                          draftStartPeriod === "AM" ? "#1e90ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: draftStartPeriod === "AM" ? "#fff" : "#1e90ff",
                        }}
                      >
                        {draftStartPeriod}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: 6,
                    }}
                  >
                    End Time
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: 2,
                        borderColor: "#1e90ff",
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 18,
                        backgroundColor: "#fff",
                        textAlign: "center",
                      }}
                      keyboardType="numeric"
                      value={draftEndHour12}
                      onChangeText={(text) => {
                        if (text.trim() === "") {
                          setDraftEndHour12("");
                          return;
                        }

                        const parsed = parseInt(text, 10);
                        if (Number.isNaN(parsed)) {
                          setDraftEndHour12("");
                          return;
                        }

                        setDraftEndHour12(String(clampHour12(parsed)));
                      }}
                      placeholder="1-12"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setDraftEndPeriod(draftEndPeriod === "AM" ? "PM" : "AM")
                      }
                      style={{
                        width: 60,
                        borderWidth: 2,
                        borderColor: "#1e90ff",
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor:
                          draftEndPeriod === "AM" ? "#1e90ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: draftEndPeriod === "AM" ? "#fff" : "#1e90ff",
                        }}
                      >
                        {draftEndPeriod}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>Budget</Text>
              <TextInput
                value={draftMaxPrice}
                onChangeText={setDraftMaxPrice}
                keyboardType="number-pad"
                style={{
                  borderWidth: 1,
                  borderColor: "#cdd9e5",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  marginBottom: 10,
                }}
              />

              <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
                Distance (miles)
              </Text>
              <TextInput
                value={draftMaxDistance}
                onChangeText={setDraftMaxDistance}
                keyboardType="number-pad"
                style={{
                  borderWidth: 1,
                  borderColor: "#cdd9e5",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  marginBottom: 10,
                }}
              />

              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 16,
                  marginBottom: 8,
                  color: "#1a1a1a",
                }}
              >
                Categories
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {DATE_CATEGORIES.map((category, index) => {
                  const isSelected = draftCategoriesChecked[index];
                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() => toggleDraftCategory(index)}
                      style={{
                        backgroundColor: isSelected ? "#1e90ff" : "#ffffff",
                        borderColor: isSelected ? "#1e90ff" : "#b8c2cc",
                        borderWidth: 2,
                        borderRadius: 999,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: isSelected ? "#ffffff" : "#2c3e50",
                        }}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setDraftHasStarvingStudentCard((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                  backgroundColor: "#eaf4ff",
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: draftHasStarvingStudentCard
                      ? "#1e90ff"
                      : "#7a8a99",
                    backgroundColor: draftHasStarvingStudentCard
                      ? "#1e90ff"
                      : "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {draftHasStarvingStudentCard ? (
                    <Text
                      style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}
                    >
                      ✓
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    marginLeft: 14,
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#1f2d3d",
                  }}
                >
                  I have a Starving Student Card
                </Text>
              </TouchableOpacity>

              {editError ? (
                <Text style={{ color: "#b42318", marginBottom: 10 }}>
                  {editError}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowEditDatePicker(false);
                    setIsEditModalVisible(false);
                    setEditError(null);
                  }}
                  style={{
                    backgroundColor: "#6c757d",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={applyEditsAndRegenerate}
                  style={{
                    backgroundColor: "#28a745",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Generate
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {showEditDatePicker ? (
            <View
              style={{
                position: "absolute",
                top: 80,
                left: 20,
                right: 20,
                backgroundColor: "rgba(0,0,0,0.2)",
                padding: 8,
                borderRadius: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#dce6ef",
                  overflow: "hidden",
                }}
              >
                <DateTimePicker
                  value={draftDateValue}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  themeVariant={Platform.OS === "ios" ? "light" : undefined}
                  onChange={(event, date) => {
                    if (Platform.OS === "android") {
                      setShowEditDatePicker(false);
                      if (event.type === "set" && date) {
                        setDraftSelectedDate(date.toISOString().slice(0, 10));
                      }
                      return;
                    }

                    if (date) {
                      setDraftSelectedDate(date.toISOString().slice(0, 10));
                    }
                  }}
                />
                {Platform.OS === "ios" ? (
                  <TouchableOpacity
                    onPress={() => setShowEditDatePicker(false)}
                    style={{
                      alignItems: "center",
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderTopColor: "#dce6ef",
                    }}
                  >
                    <Text
                      style={{
                        color: "#1e90ff",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color: "#1f2d3d",
                    }}
                  >
                    Idea {index + 1}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      saveDateIdea(idea);
                      Alert.alert("Date Saved!");
                    }}
                    style={{
                      alignSelf: "flex-end",
                      backgroundColor: "#1e90ff",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Save
                    </Text>
                  </TouchableOpacity>
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
                  {idea.filledTemplate}
                </Text>

                {typeof idea.recipeIndex === "number" ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("RecipeDetail", {
                        index: idea.recipeIndex,
                      })
                    }
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
                        {/* {step.place?.googleMapsUri ? (
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
                        ) : null} */}

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
