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
import EditInputsModal from "../Components/EditInputsModal";
import type { AppScreenProps, PlannedDateResultsParams } from "../types/navigation";
import useDatePlannerIdeas, { PlaceSummary } from "../hooks/useDatePlannerIdeas";
import useFilledIdeas, {
  estimateTravelMinutesBetween,
  estimateTravelMinutesFromUserLocation,
  getCandidatesForSlot,
  rebuildScheduleTimes,
} from "../hooks/useFilledIdeas";
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

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceMilesFromUserLocation(
  userLocation: { latitude: number; longitude: number } | null | undefined,
  placeLocation: { latitude?: number; longitude?: number } | null | undefined,
): number | null {
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
}

function formatDistanceMiles(distanceMiles: number | null): string {
  if (distanceMiles === null) {
    return "Distance unavailable";
  }

  if (distanceMiles < 0.1) {
    return "< 0.1 mi away";
  }

  return `${distanceMiles.toFixed(1)} mi away`;
}

export default function PlannedDateResults({ route, navigation }: AppScreenProps<"PlannedDateResults">) {
  const { isUnlocked } = usePremium();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"date_history_limit" | "mile_radius_limit" | "ideas_limit" | "general">("general");
  const [image, setImage] = useState(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
  const [nativeAdDisplayComplete, setNativeAdDisplayComplete] = useState(false);
  const nativeAdHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRegenerateRef = useRef<(() => void) | null>(null);

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
  const [showDevCachedPlaces, setShowDevCachedPlaces] = useState(false);
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
        minDurationMinutes: newCandidate.minDurationMinutes,
        maxDurationMinutes: newCandidate.maxDurationMinutes,
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
        const updatedFirstPlace = updatedSchedule[0]?.place ?? null;
        const updatedLastPlace = updatedSchedule[updatedSchedule.length - 1]?.place ?? null;
        const updatedCommuteToFirstMinutes =
          estimateTravelMinutesFromUserLocation(plannerParams.userLocation, updatedFirstPlace) ??
          (updatedFirstPlace?.sourceKind === "place" ? 10 : 0);
        const updatedCommuteFromLastMinutes =
          estimateTravelMinutesFromUserLocation(plannerParams.userLocation, updatedLastPlace) ??
          (updatedLastPlace?.sourceKind === "place" ? 10 : 0);
        const rebuiltSchedule = rebuildScheduleTimes(
          updatedSchedule,
          updatedCommuteToFirstMinutes || 0,
          updatedCommuteFromLastMinutes || 0,
          plannerParams,
        );
        newMap.set(ideaIndex, {
          ...ideaMods,
          schedule: rebuiltSchedule,
          filledTemplate: updatedFilledTemplate,
          places: updatedPlaces,
          commuteToFirstMinutes: updatedCommuteToFirstMinutes || null,
          commuteFromLastMinutes: updatedCommuteFromLastMinutes || null,
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

  const { places, cachedPlaces, allCachedPlaces, recipes, activities, sourceFile, isLoading, error, refetch } =
    useDatePlannerIdeas(plannerParams);

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

  useEffect(() => {
    if (!nativeAdDisplayComplete || !pendingRegenerateRef.current) {
      return;
    }

    const pendingAction = pendingRegenerateRef.current;
    pendingRegenerateRef.current = null;
    pendingAction();
  }, [nativeAdDisplayComplete]);

  const resetNativeAdGate = () => {
    setNativeAdDisplayComplete(false);

    if (nativeAdHoldTimerRef.current) {
      clearTimeout(nativeAdHoldTimerRef.current);
      nativeAdHoldTimerRef.current = null;
    }
  };

  const startRegenerate = () => {
    setImage(IMAGES[Math.floor(Math.random() * IMAGES.length)]);

    const runRefresh = () => {
      refetch({ bypassCache: true });
    };

    if (isUnlocked) {
      runRefresh();
      return;
    }

    pendingRegenerateRef.current = runRefresh;
    resetNativeAdGate();
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

    resetNativeAdGate();
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
        backgroundColor: "transparent",
      }}
    >
      <Text
        style={{
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
          No places found nearby. Date ideas won't include any travel. You may need to try generating again or increasing the distance
          filter in edit inputs.
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
        <Text style={{ color: "#fff", fontSize: 16 }}>Edit Inputs</Text>
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
        <Text style={{ color: "#fff", fontSize: 16 }}>Regenerate</Text>
      </TouchableOpacity>

      <EditInputsModal
        visible={isEditModalVisible}
        onRequestClose={() => {
          setShowEditDatePicker(false);
          setIsEditModalVisible(false);
        }}
        editModalScrollRef={editModalScrollRef}
        showEditDatePicker={showEditDatePicker}
        setShowEditDatePicker={setShowEditDatePicker}
        draftSelectedDate={draftSelectedDate}
        setDraftSelectedDate={setDraftSelectedDate}
        draftDateValue={draftDateValue}
        draftStartHour12={draftStartHour12}
        setDraftStartHour12={setDraftStartHour12}
        draftStartPeriod={draftStartPeriod}
        setDraftStartPeriod={setDraftStartPeriod}
        draftEndHour12={draftEndHour12}
        setDraftEndHour12={setDraftEndHour12}
        draftEndPeriod={draftEndPeriod}
        setDraftEndPeriod={setDraftEndPeriod}
        draftDateLengthHours={draftDateLengthHours}
        setDraftDateLengthHours={(s) => setDraftDateLengthHours(sanitizeHourOrMinute(s, 23))}
        draftDateLengthMinutes={draftDateLengthMinutes}
        setDraftDateLengthMinutes={(s) => setDraftDateLengthMinutes(sanitizeHourOrMinute(s, 59))}
        draftMaxPrice={draftMaxPrice}
        setDraftMaxPrice={setDraftMaxPrice}
        draftMaxDistance={draftMaxDistance}
        setDraftMaxDistance={setDraftMaxDistance}
        draftCategoriesChecked={draftCategoriesChecked}
        toggleDraftCategory={toggleDraftCategory}
        editError={editError}
        applyEditsAndRegenerate={applyEditsAndRegenerate}
        handleEditInputFocus={handleEditInputFocus}
      />

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
                color: "#2c3e50",
              }}
            >
              Debug Data
            </Text>
            <Text style={{ color: "#1e90ff" }}>{showDevMatches ? "Hide" : "Show"}</Text>
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
                    color: "#2c3e50",
                  }}
                >
                  Places ({places.length})
                </Text>
                <Text style={{ color: "#1e90ff" }}>{showDevPlaces ? "Hide" : "Show"}</Text>
              </TouchableOpacity>

              {showDevPlaces ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 12,
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
                onPress={() => setShowDevCachedPlaces((prev) => !prev)}
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
                    color: "#2c3e50",
                  }}
                >
                  Cached Places ({allCachedPlaces.length})
                </Text>
                <Text style={{ color: "#1e90ff" }}>{showDevCachedPlaces ? "Hide" : "Show"}</Text>
              </TouchableOpacity>

              {showDevCachedPlaces ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10, gap: 6 }}>
                  {allCachedPlaces.length ? (
                    allCachedPlaces.map((place) => (
                      <Text key={place.id} style={{ fontSize: 14, color: "#2c3e50" }}>
                        • {place.name}: {place.type} (
                        {formatDistanceMiles(getDistanceMilesFromUserLocation(plannerParams.userLocation, place.location))})
                      </Text>
                    ))
                  ) : (
                    <Text style={{ fontSize: 14, color: "#667788" }}>No cached places on this phone.</Text>
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
                    color: "#2c3e50",
                  }}
                >
                  Activities ({activities.length})
                </Text>
                <Text style={{ color: "#1e90ff" }}>{showDevActivities ? "Hide" : "Show"}</Text>
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
                    color: "#2c3e50",
                  }}
                >
                  Recipes ({recipes.length})
                </Text>
                <Text style={{ color: "#1e90ff" }}>{showDevRecipes ? "Hide" : "Show"}</Text>
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
            onPress={() => refetch()}
            style={{
              backgroundColor: "#1e90ff",
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15 }}>Retry</Text>
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
            const modifiedCommuteToFirstMinutes = modifiedIdeas.get(index)?.commuteToFirstMinutes;
            const modifiedCommuteFromLastMinutes = modifiedIdeas.get(index)?.commuteFromLastMinutes;
            const commuteToFirstMinutes = modifiedCommuteToFirstMinutes ?? idea.commuteToFirstMinutes;
            const commuteFromLastMinutes = modifiedCommuteFromLastMinutes ?? idea.commuteFromLastMinutes;
            const currentIdea = {
              ...idea,
              filledTemplate,
              places: ideaPlacesRecord,
              schedule,
              commuteToFirstMinutes,
              commuteFromLastMinutes,
            };

            return (
              <DateIdeaCard
                key={`${idea.filledTemplate}-${index}`}
                index={index}
                filledTemplate={filledTemplate}
                template={idea.template}
                schedule={schedule}
                places={ideaPlaces as PlaceSummary[]}
                userLocation={plannerParams.userLocation ?? null}
                commuteToFirstMinutes={commuteToFirstMinutes}
                commuteFromLastMinutes={commuteFromLastMinutes}
                navigation={navigation}
                recipeIndex={idea.recipeIndex}
                onPrimaryAction={() => {
                  if (!canSaveIdea(isUnlocked)) {
                    setPaywallReason("general");
                    setPaywallVisible(true);
                    return;
                  }
                  saveDateIdea(currentIdea, plannerParams.selectedDate);
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
