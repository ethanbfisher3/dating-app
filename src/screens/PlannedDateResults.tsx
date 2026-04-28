import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { AppScreenProps, PlannedDateResultsParams } from "../types/navigation";
import useDatePlannerIdeas, { PlaceSummary } from "../hooks/useDatePlannerIdeas";
import useFilledIdeas, { estimateTravelMinutesBetween, getCandidatesForSlot } from "../hooks/useFilledIdeas";
import { saveDateIdea, canSaveIdea } from "../data/savedIdeasStore";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "../Components/PaywallModal";
import DateIdeaCard from "../Components/DateIdeaCard";
import CustomNativeAd from "../Components/CustomNativeAd";
import { DATE_CATEGORIES } from "src/utils/utils";

const IMAGES = [
  require("../assets/images/date_images/idea.jpg"),
  require("../assets/images/date_images/mall.jpg"),
  require("../assets/images/date_images/mini_golf.jpg"),
  require("../assets/images/date_images/museum.jpg"),
  require("../assets/images/date_images/laser_tag.jpg"),
  require("../assets/images/date_images/video_games.jpg"),
  require("../assets/images/date_images/board_games.jpg"),
  require("../assets/images/date_images/puzzle.jpg"),
  require("../assets/images/date_images/origami.jpg"),
];

export default function PlannedDateResults({ route, navigation }: AppScreenProps<"PlannedDateResults">) {
  const { isUnlocked } = usePremium();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"date_history_limit" | "mile_radius_limit" | "ideas_limit" | "general">("general");
  const [image, setImage] = useState(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
  const [nativeAdDisplayComplete, setNativeAdDisplayComplete] = useState(false);
  const nativeAdHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
      title: "Date Ideas",
    });
  }, [navigation]);

  const [plannerParams, setPlannerParams] = useState<PlannedDateResultsParams>(route.params);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draftSelectedDate, setDraftSelectedDate] = useState(route.params.selectedDate);
  const initialStartHour24 = ((route.params.startHour % 24) + 24) % 24;
  const initialEndHour24 = ((route.params.endHour % 24) + 24) % 24;
  const [draftStartHour12, setDraftStartHour12] = useState(String(initialStartHour24 % 12 === 0 ? 12 : initialStartHour24 % 12));
  const [draftStartPeriod, setDraftStartPeriod] = useState<"AM" | "PM">(initialStartHour24 < 12 ? "AM" : "PM");
  const [draftEndHour12, setDraftEndHour12] = useState(String(initialEndHour24 % 12 === 0 ? 12 : initialEndHour24 % 12));
  const [draftEndPeriod, setDraftEndPeriod] = useState<"AM" | "PM">(initialEndHour24 < 12 ? "AM" : "PM");
  const initialDateLengthMinutes =
    typeof route.params.dateLengthMinutes === "number" && route.params.dateLengthMinutes > 0
      ? route.params.dateLengthMinutes
      : Math.max(
          60,
          (initialEndHour24 > initialStartHour24 ? initialEndHour24 - initialStartHour24 : 24 - initialStartHour24 + initialEndHour24) * 60,
        );
  const [draftDateLengthHours, setDraftDateLengthHours] = useState(String(Math.floor(initialDateLengthMinutes / 60)));
  const [draftDateLengthMinutes, setDraftDateLengthMinutes] = useState(String(initialDateLengthMinutes % 60));
  const [draftMaxPrice, setDraftMaxPrice] = useState(String(route.params.maxPrice));
  const [draftMaxDistance, setDraftMaxDistance] = useState(String(route.params.maxDistance));
  const [draftCategoriesChecked, setDraftCategoriesChecked] = useState(
    DATE_CATEGORIES.map((category) => route.params.categories.includes(category)),
  );
  const [showDevMatches, setShowDevMatches] = useState(false);
  const [showDevPlaces, setShowDevPlaces] = useState(false);
  const [showDevActivities, setShowDevActivities] = useState(false);
  const [showDevRecipes, setShowDevRecipes] = useState(false);
  const [regeneratingSteps, setRegeneratingSteps] = useState<Set<string>>(new Set());
  const [modifiedIdeas, setModifiedIdeas] = useState<Map<number, any>>(new Map());
  const editModalScrollRef = useRef<ScrollView>(null);

  const regenerateStep = async (ideaIndex: number, stepIndex: number, idea: any) => {
    const stepKey = `${ideaIndex}-${stepIndex}`;
    const schedule = idea.schedule || [];
    const step = schedule[stepIndex];
    if (!step) return;

    setRegeneratingSteps((prev) => new Set(prev).add(stepKey));

    try {
      // Get candidates for the slot type
      const candidates = getCandidatesForSlot(step.slot, places, recipes, activities);

      if (!candidates.length) {
        Alert.alert("No alternatives available for this item.");
        setRegeneratingSteps((prev) => {
          const next = new Set(prev);
          next.delete(stepKey);
          return next;
        });
        return;
      }

      // Pick a random candidate
      const newCandidate = candidates[Math.floor(Math.random() * candidates.length)];

      // Calculate new travel times
      const prevStep = stepIndex > 0 ? schedule[stepIndex - 1] : null;
      const nextStep = stepIndex < schedule.length - 1 ? schedule[stepIndex + 1] : null;

      let newTravelToNextMinutes: number | null = null;
      let newTravelFromPrevMinutes: number | null = null;

      if (nextStep) {
        newTravelToNextMinutes = estimateTravelMinutesBetween(newCandidate.place || null, nextStep.place || null);
        if (newTravelToNextMinutes === null) {
          newTravelToNextMinutes = newCandidate.place?.sourceKind === "place" || nextStep.place?.sourceKind === "place" ? 10 : 0;
        }
      }

      // Create the new step with updated values
      const updatedStep = {
        ...step,
        title: newCandidate.value,
        place: newCandidate.place,
        travelToNextMinutes: newTravelToNextMinutes,
      };

      // If there's a previous step, update its travelToNextMinutes
      const updatedSchedule = [...schedule];
      updatedSchedule[stepIndex] = updatedStep;

      if (prevStep && stepIndex > 0) {
        const prevTravelMinutes = estimateTravelMinutesBetween(prevStep.place || null, newCandidate.place || null);
        updatedSchedule[stepIndex - 1] = {
          ...prevStep,
          travelToNextMinutes:
            prevTravelMinutes !== null
              ? prevTravelMinutes
              : prevStep.place?.sourceKind === "place" || newCandidate.place?.sourceKind === "place"
                ? 10
                : 0,
        };
      }

      // Rebuild the filledTemplate with the new step title
      let updatedFilledTemplate = idea.filledTemplate || idea.template;
      updatedFilledTemplate = updatedFilledTemplate.replace(step.title, newCandidate.value);

      // Update places record with the new place
      const updatedPlaces = { ...idea.places };
      const placeKey = `${step.slot}_${stepIndex + 1}`;
      updatedPlaces[placeKey] = newCandidate.place || null;

      // Update modified ideas state with schedule, template, and places
      setModifiedIdeas((prev) => {
        const newMap = new Map(prev);
        const ideaMods = newMap.get(ideaIndex) || {};
        newMap.set(ideaIndex, {
          ...ideaMods,
          schedule: updatedSchedule,
          filledTemplate: updatedFilledTemplate,
          places: updatedPlaces,
        });
        return newMap;
      });
    } finally {
      setRegeneratingSteps((prev) => {
        const next = new Set(prev);
        next.delete(stepKey);
        return next;
      });
    }
  };

  const { places, recipes, activities, sourceFile, isLoading, error, refetch } = useDatePlannerIdeas(plannerParams);

  const startNativeAdHoldTimer = () => {
    setNativeAdDisplayComplete(false);

    if (nativeAdHoldTimerRef.current) {
      clearTimeout(nativeAdHoldTimerRef.current);
    }

    nativeAdHoldTimerRef.current = setTimeout(() => {
      setNativeAdDisplayComplete(true);
      nativeAdHoldTimerRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    if (isLoading) {
      setNativeAdDisplayComplete(false);

      if (nativeAdHoldTimerRef.current) {
        clearTimeout(nativeAdHoldTimerRef.current);
        nativeAdHoldTimerRef.current = null;
      }
    }
  }, [isLoading]);

  const resetNativeAdGate = () => {
    setNativeAdDisplayComplete(false);

    if (nativeAdHoldTimerRef.current) {
      clearTimeout(nativeAdHoldTimerRef.current);
      nativeAdHoldTimerRef.current = null;
    }
  };

  const filledIdeas = useFilledIdeas({
    params: plannerParams,
    places,
    recipes,
    activities,
  });

  const { maxDistance } = plannerParams;

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

  const sanitizeHourOrMinute = (text: string, maximum: number) => {
    if (text.trim() === "") {
      return "";
    }

    const parsed = Number.parseInt(text, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return "";
    }

    return String(Math.min(parsed, maximum));
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
    setDraftDateLengthHours(String(Math.floor((plannerParams.dateLengthMinutes || 0) / 60)));
    setDraftDateLengthMinutes(String((plannerParams.dateLengthMinutes || 0) % 60));
    setDraftMaxPrice(String(plannerParams.maxPrice));
    setDraftMaxDistance(String(plannerParams.maxDistance));
    setDraftCategoriesChecked(DATE_CATEGORIES.map((category) => plannerParams.categories.includes(category)));
    setShowEditDatePicker(false);
    setEditError(null);
    setIsEditModalVisible(true);
  };

  const applyEditsAndRegenerate = () => {
    const nextStartHour12 = Number.parseInt(draftStartHour12, 10);
    const nextEndHour12 = Number.parseInt(draftEndHour12, 10);
    const nextDateLengthHours = Number.parseInt(draftDateLengthHours || "0", 10);
    const nextDateLengthMinutes = Number.parseInt(draftDateLengthMinutes || "0", 10);
    const nextMaxPrice = Number.parseInt(draftMaxPrice, 10);
    let nextMaxDistance = Number.parseInt(draftMaxDistance, 10);
    const nextCategories = DATE_CATEGORIES.filter((_, index) => draftCategoriesChecked[index]);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(draftSelectedDate)) {
      setEditError("Date must be in YYYY-MM-DD format.");
      return;
    }

    if (Number.isNaN(nextStartHour12) || Number.isNaN(nextEndHour12)) {
      setEditError("Start and end hours are required.");
      return;
    }

    if (clampHour12(nextStartHour12) !== nextStartHour12 || clampHour12(nextEndHour12) !== nextEndHour12) {
      setEditError("Start and end hours must be between 1 and 12.");
      return;
    }

    if (Number.isNaN(nextMaxPrice) || nextMaxPrice < 0) {
      setEditError("Budget must be a non-negative number.");
      return;
    }

    if (Number.isNaN(nextDateLengthHours) || Number.isNaN(nextDateLengthMinutes) || nextDateLengthHours < 0 || nextDateLengthMinutes < 0) {
      setEditError("Date length must be valid hours and minutes.");
      return;
    }

    const totalDateLengthMinutes = nextDateLengthHours * 60 + nextDateLengthMinutes;
    if (totalDateLengthMinutes <= 0) {
      setEditError("Date length must be at least 1 minute.");
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

    const start24 = convertTo24Hour(nextStartHour12, draftStartPeriod);
    const end24 = convertTo24Hour(nextEndHour12, draftEndPeriod);
    let windowDurationMinutes = (end24 - start24) * 60;
    if (windowDurationMinutes <= 0) {
      windowDurationMinutes += 24 * 60;
    }

    if (totalDateLengthMinutes > windowDurationMinutes) {
      setEditError("Date length must fit inside your selected start and end times.");
      return;
    }

    setImage(IMAGES[Math.floor(Math.random() * IMAGES.length)]);

    setPlannerParams({
      selectedDate: draftSelectedDate,
      startHour: start24,
      endHour: end24,
      dateLengthMinutes: totalDateLengthMinutes,
      maxPrice: nextMaxPrice,
      maxDistance: nextMaxDistance,
      serverTarget: plannerParams.serverTarget,
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

  const shouldShowLoadingGate = !error && (isLoading || (!isUnlocked && !nativeAdDisplayComplete));

  useEffect(() => {
    return () => {
      if (nativeAdHoldTimerRef.current) {
        clearTimeout(nativeAdHoldTimerRef.current);
      }
    };
  }, []);

  const handleEditInputFocus = (event: any) => {
    const target = event?.target;
    if (!target) {
      return;
    }

    setTimeout(() => {
      (editModalScrollRef.current as any)?.scrollResponderScrollNativeHandleToKeyboard?.(target, 120, true);
    }, 120);
  };

  if (shouldShowLoadingGate) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fafbfc",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text
          style={{
            marginTop: 16,
            color: "#1f2d3d",
            fontSize: 20,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Generating Your Date Ideas...
        </Text>
        <Text
          style={{
            marginTop: 10,
            color: "#556677",
            fontSize: 15,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Finding places and building the best matches for your preferences.
        </Text>
        {!isUnlocked ? (
          <View style={{ width: "100%", marginTop: 24 }}>
            <CustomNativeAd
              onLoaded={() => {
                startNativeAdHoldTimer();
              }}
              onError={() => {
                console.warn("[PlannedDateResults] Native ad failed to load; allowing results to continue.");
                startNativeAdHoldTimer();
              }}
            />
          </View>
        ) : null}
      </View>
    );
  }

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
          marginBottom: 24,
          marginTop: 12,
          color: "#1a1a1a",
        }}
      >
        Results
      </Text>

      <Image
        source={image}
        style={{
          width: "100%",
          height: 200,
          borderRadius: 12,
          marginBottom: 20,
        }}
      />

      {places.length === 0 && maxDistance > 0 && (
        <Text
          style={{
            marginBottom: 16,
            fontSize: 17,
            lineHeight: 26,
            color: "darkorange",
          }}
        >
          No places found nearby. Date ideas won't include any travel
        </Text>
      )}

      <TouchableOpacity
        onPress={openEditModal}
        style={{
          backgroundColor: "#1e90ff",
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Edit Inputs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          resetNativeAdGate();
          setImage(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
          refetch();
        }}
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
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Regenerate</Text>
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
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            padding: 20,
          }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
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
              ref={editModalScrollRef}
              showsVerticalScrollIndicator
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
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
                  marginBottom: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontSize: 16, color: "#1a1a1a" }}>{draftSelectedDate}</Text>
              </TouchableOpacity>

              {showEditDatePicker ? (
                <DateTimePicker
                  value={draftDateValue}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, value) => {
                    if (Platform.OS !== "ios") {
                      setShowEditDatePicker(false);
                    }

                    if (!value) {
                      return;
                    }

                    const year = value.getFullYear();
                    const month = String(value.getMonth() + 1).padStart(2, "0");
                    const day = String(value.getDate()).padStart(2, "0");
                    setDraftSelectedDate(`${year}-${month}-${day}`);
                  }}
                />
              ) : null}

              <Text
                style={{
                  marginBottom: 10,
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2c3e50",
                }}
              >
                Time Window
              </Text>

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
                    Start Hour
                  </Text>
                  <TextInput
                    value={draftStartHour12}
                    onChangeText={setDraftStartHour12}
                    keyboardType="number-pad"
                    onFocus={handleEditInputFocus}
                    style={{
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>

                <View style={{ width: 96 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: 6,
                    }}
                  >
                    AM/PM
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {(["AM", "PM"] as const).map((period) => (
                      <TouchableOpacity
                        key={`start-${period}`}
                        onPress={() => setDraftStartPeriod(period)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          alignItems: "center",
                          backgroundColor: draftStartPeriod === period ? "#1e90ff" : "#fff",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color: draftStartPeriod === period ? "#fff" : "#1f2d3d",
                          }}
                        >
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

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
                    End Hour
                  </Text>
                  <TextInput
                    value={draftEndHour12}
                    onChangeText={setDraftEndHour12}
                    keyboardType="number-pad"
                    onFocus={handleEditInputFocus}
                    style={{
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>

                <View style={{ width: 96 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: 6,
                    }}
                  >
                    AM/PM
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {(["AM", "PM"] as const).map((period) => (
                      <TouchableOpacity
                        key={`end-${period}`}
                        onPress={() => setDraftEndPeriod(period)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          alignItems: "center",
                          backgroundColor: draftEndPeriod === period ? "#1e90ff" : "#fff",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color: draftEndPeriod === period ? "#fff" : "#1f2d3d",
                          }}
                        >
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Date Length</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      value={draftDateLengthHours}
                      onChangeText={(text) => setDraftDateLengthHours(sanitizeHourOrMinute(text, 23))}
                      keyboardType="number-pad"
                      placeholder="Hours"
                      onFocus={handleEditInputFocus}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#dce6ef",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                    />
                    <TextInput
                      value={draftDateLengthMinutes}
                      onChangeText={(text) => setDraftDateLengthMinutes(sanitizeHourOrMinute(text, 59))}
                      keyboardType="number-pad"
                      placeholder="Minutes"
                      onFocus={handleEditInputFocus}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#dce6ef",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Max Budget ($)</Text>
                  <TextInput
                    value={draftMaxPrice}
                    onChangeText={setDraftMaxPrice}
                    keyboardType="number-pad"
                    onFocus={handleEditInputFocus}
                    style={{
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Max Distance (miles)</Text>
                  <TextInput
                    value={draftMaxDistance}
                    onChangeText={setDraftMaxDistance}
                    keyboardType="number-pad"
                    onFocus={handleEditInputFocus}
                    style={{
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>
              </View>

              <Text
                style={{
                  color: "#4b5b6b",
                  marginBottom: 8,
                  fontWeight: "700",
                }}
              >
                Categories
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {DATE_CATEGORIES.map((category, index) => {
                  const checked = draftCategoriesChecked[index];
                  return (
                    <TouchableOpacity
                      key={category}
                      onPress={() => toggleDraftCategory(index)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: checked ? "#1e90ff" : "#dce6ef",
                        backgroundColor: checked ? "#e8f3ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          color: checked ? "#1e90ff" : "#4b5b6b",
                          fontWeight: checked ? "700" : "500",
                        }}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {editError ? <Text style={{ color: "#b42318", marginBottom: 10 }}>{editError}</Text> : null}

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
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    backgroundColor: "#fff",
                  }}
                >
                  <Text style={{ color: "#3b4a5a", fontWeight: "700" }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={applyEditsAndRegenerate}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: "#1e90ff",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Apply & Regenerate</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {__DEV__ ? (
        <View
          style={{
            backgroundColor: "#f6f9fc",
            borderWidth: 1,
            borderColor: "#dce6ef",
            borderRadius: 12,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowDevMatches((prev) => !prev)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#2c3e50",
              }}
            >
              Debug Data
            </Text>
            <Text style={{ color: "#1e90ff", fontWeight: "700" }}>{showDevMatches ? "Hide" : "Show"}</Text>
          </TouchableOpacity>

          {showDevMatches ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#e8eef5",
                paddingVertical: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowDevPlaces((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#2c3e50",
                  }}
                >
                  Places ({places.length})
                </Text>
                <Text style={{ color: "#1e90ff", fontWeight: "700" }}>{showDevPlaces ? "Hide" : "Show"}</Text>
              </TouchableOpacity>

              {showDevPlaces ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#667788",
                      marginBottom: 2,
                    }}
                  >
                    Returned places
                  </Text>
                  {places.length ? (
                    places.map((place) => (
                      <Text key={place.id} style={{ fontSize: 14, color: "#2c3e50" }}>
                        • {place.name}: {place.type}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: "#667788" }}>No places.</Text>
                  )}
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => setShowDevActivities((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#eef2f7",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#2c3e50",
                  }}
                >
                  Activities ({activities.length})
                </Text>
                <Text style={{ color: "#1e90ff", fontWeight: "700" }}>{showDevActivities ? "Hide" : "Show"}</Text>
              </TouchableOpacity>

              {showDevActivities ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 6 }}>
                  {activities.length ? (
                    activities.map((activity) => (
                      <Text key={activity.id} style={{ fontSize: 14, color: "#2c3e50" }}>
                        • {activity.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: "#667788" }}>No activities.</Text>
                  )}
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => setShowDevRecipes((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#eef2f7",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#2c3e50",
                  }}
                >
                  Recipes ({recipes.length})
                </Text>
                <Text style={{ color: "#1e90ff", fontWeight: "700" }}>{showDevRecipes ? "Hide" : "Show"}</Text>
              </TouchableOpacity>

              {showDevRecipes ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 6 }}>
                  {recipes.length ? (
                    recipes.map((recipe, index) => (
                      <Text key={index} style={{ fontSize: 14, color: "#2c3e50" }}>
                        • {recipe.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: "#667788" }}>No recipes.</Text>
                  )}
                </View>
              ) : null}
            </View>
          ) : null}

          {sourceFile ? (
            <Text
              style={{
                marginBottom: 16,
                paddingLeft: 16,
                fontSize: 13,
                color: "#7a8a99",
              }}
            >
              Source: {sourceFile}
            </Text>
          ) : null}
        </View>
      ) : null}

      {isLoading ? (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={{ marginTop: 12, color: "#555", fontSize: 16 }}>Building your date ideas...</Text>
        </View>
      ) : null}

      {!isLoading && __DEV__ && error ? (
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
          <Text style={{ color: "#9b2226", fontSize: 15, marginBottom: 10 }}>(DEV) Could not load date ideas.</Text>
          {<Text style={{ color: "#9b2226", fontSize: 13, marginBottom: 12 }}>{error}</Text>}
          <TouchableOpacity
            onPress={refetch}
            style={{
              backgroundColor: "#1e90ff",
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading
        ? filledIdeas.map((idea, index) => {
            const modifiedPlaces = modifiedIdeas.get(index)?.places;
            const ideaPlacesRecord = modifiedPlaces || idea.places || {};
            const ideaPlaces = Object.values(ideaPlacesRecord).filter(Boolean);
            const modifiedSchedule = modifiedIdeas.get(index)?.schedule;
            const schedule = modifiedSchedule || idea.schedule || [];
            const modifiedFilledTemplate = modifiedIdeas.get(index)?.filledTemplate;
            const filledTemplate = modifiedFilledTemplate || idea.filledTemplate;

            return (
              <DateIdeaCard
                key={`${idea.filledTemplate}-${index}`}
                index={index}
                filledTemplate={filledTemplate}
                schedule={schedule}
                places={ideaPlaces as PlaceSummary[]}
                commuteToFirstMinutes={idea.commuteToFirstMinutes}
                commuteFromLastMinutes={idea.commuteFromLastMinutes}
                navigation={navigation}
                recipeIndex={idea.recipeIndex}
                onPrimaryAction={() => {
                  if (!canSaveIdea(isUnlocked)) {
                    setPaywallReason("general");
                    setPaywallVisible(true);
                    return;
                  }
                  saveDateIdea(idea, plannerParams.selectedDate);
                  Alert.alert("Date Idea Saved!");
                }}
                primaryActionLabel="Save"
                onRegenerateStep={(stepIndex) => regenerateStep(index, stepIndex, idea)}
                isRegeneratingStep={(stepIndex) => regeneratingSteps.has(`${index}-${stepIndex}`)}
              />
            );
          })
        : null}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason={paywallReason} />
    </ScrollView>
  );
}
