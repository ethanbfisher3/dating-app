import React, { useEffect, useMemo, useState, useRef } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, TextInput, TouchableOpacity, View } from "react-native";
import Text from "../Components/AppText";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import type { AppNavigation } from "../types/navigation";
import { DATE_CATEGORIES, SLOT_TO_CATEGORY, timesAreInvalid } from "../utils/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import { addPlannedDate } from "../data/plannedDatesStore";
import { fetchPlacesFromOverpassWithCache } from "../hooks/usePlacesActivitiesRecipes";
import PaywallModal from "../Components/PaywallModal";
import EditInputsModal from "../Components/EditInputsModal";
import usePurchases from "src/hooks/usePurchases";
import PageInfoModal from "../Components/PageInfoModal";
import CalendarWidget from "../Components/CalendarWidget";
import { getSavedIdeas, initializeSavedIdeas, removeSavedIdea, subscribeSavedIdeas, type SavedDateIdea } from "../data/savedIdeasStore";
import { addRecordedDate, FREE_TIER_RECORDED_DATES_LIMIT, getRecordedDates, initializeRecordedDates, subscribeRecordedDates, type RecordedDate } from "../data/dateHistoryStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import IdeaPlaceLinks from "../Components/IdeaPlaceLinks";
import type { PlaceSummary } from "../hooks/useDatePlannerIdeas";

type CategoryConfig = { icon: string; color: string; bg: string; label: string };

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Food: { icon: "restaurant", color: "#d4522a", bg: "#fef0e8", label: "Food" },
  Sports: { icon: "barbell", color: "#16803c", bg: "#edfaf2", label: "Sports" },
  Outdoors: { icon: "leaf", color: "#0d7560", bg: "#e6f4f0", label: "Outdoors" },
  Education: { icon: "book", color: "#5746af", bg: "#eeebff", label: "Education" },
  Shopping: { icon: "bag-handle", color: "#b45309", bg: "#fef8e8", label: "Shopping" },
  Entertainment: { icon: "film", color: "#7c3aed", bg: "#f3eeff", label: "Entertainment" },
};

const DEFAULT_CAT_CONFIG: CategoryConfig = { icon: "heart", color: "#e63f67", bg: "#fff0f5", label: "Date" };

function getIdeaCategory(schedule: { slot: string }[]): string | null {
  const weights: Record<string, number> = {};
  for (const step of schedule) {
    for (const part of step.slot.split("|").map((s) => s.trim())) {
      const cat = SLOT_TO_CATEGORY[part];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 1;
    }
  }
  let best: string | null = null, bestW = 0;
  for (const [cat, w] of Object.entries(weights)) {
    if (w > bestW) { best = cat; bestW = w; }
  }
  return best;
}

function getRatingColor(n: number): string {
  return `hsl(${Math.round(((n - 1) / 9) * 120)}, 72%, 40%)`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PlanADate({ navigation }: { navigation: AppNavigation }) {
  const { isUnlocked } = usePremium();
  const { lifetimePremium } = usePurchases();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const editModalScrollRef = useRef<ScrollView>(null);
  const [maxPrice, setMaxPrice] = useState<string>("20");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startHour12, setStartHour12] = useState<string>("6");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("PM");
  const [endHour12, setEndHour12] = useState<string>("9");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM");
  const [dateLengthHours, setDateLengthHours] = useState<string>("2");
  const [dateLengthMinutes, setDateLengthMinutes] = useState<string>("0");
  const [maxDistance, setMaxDistance] = useState<string>(isUnlocked ? "10" : "5");
  const [actualUserLocation, setActualUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [categoriesChecked, setCategoriesChecked] = useState(Array(DATE_CATEGORIES.length).fill(true));
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>([]);
  const [recordedDates, setRecordedDates] = useState<RecordedDate[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  // Saved idea detail popup
  const [selectedIdea, setSelectedIdea] = useState<SavedDateIdea | null>(null);

  // Mark as done form
  const [markDoneIdea, setMarkDoneIdea] = useState<SavedDateIdea | null>(null);
  const [markDoneWhoWith, setMarkDoneWhoWith] = useState("");
  const [markDoneDate, setMarkDoneDate] = useState(new Date());
  const [markDoneMoneySpent, setMarkDoneMoneySpent] = useState("");
  const [markDoneRating, setMarkDoneRating] = useState<number | null>(null);
  const [markDoneShowDatePicker, setMarkDoneShowDatePicker] = useState(false);
  const serverTarget = "overpass";

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setActualUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {}
    };

    loadLocation();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = () => { if (isMounted) setSavedIdeas(getSavedIdeas()); };
    void initializeSavedIdeas().then(load);
    const unsub = subscribeSavedIdeas(load);
    return () => { isMounted = false; unsub(); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      if (!isMounted) return;
      setRecordedDates(getRecordedDates().filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.dateOfDate)));
    };
    void initializeRecordedDates().then(load);
    const unsub = subscribeRecordedDates(load);
    return () => { isMounted = false; unsub(); };
  }, []);

  useEffect(() => {
    setMaxDistance((prev) => {
      if (isUnlocked) return prev === "5" ? "10" : prev;
      return Number.parseInt(prev, 10) > 5 ? "5" : prev;
    });
  }, [isUnlocked]);
  const selectedCategoriesCount = useMemo(() => categoriesChecked.filter(Boolean).length, [categoriesChecked]);

  const selectedRecordedDates = useMemo(() => {
    if (!selectedDateKey) return [];
    return recordedDates.filter((e) => e.dateOfDate === selectedDateKey);
  }, [recordedDates, selectedDateKey]);

  const selectedSavedIdeas = useMemo(() => {
    if (!selectedDateKey) return [];
    return savedIdeas.filter((e) => e.selectedDate === selectedDateKey);
  }, [savedIdeas, selectedDateKey]);

  const handleCalendarDayPress = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setIsDetailsModalVisible(true);
  };

  const closeDateDetails = () => {
    setIsDetailsModalVisible(false);
    setSelectedDateKey(null);
  };

  const clampHour12 = (value: number) => {
    if (Number.isNaN(value)) return 1;
    if (value < 1) return 1;
    if (value > 12) return 12;
    return value;
  };

  const convertTo24Hour = (hour12: number, period: "AM" | "PM") => {
    let hour24 = hour12;
    if (period === "AM") {
      hour24 = hour12 === 12 ? 0 : hour12;
    } else {
      hour24 = hour12 === 12 ? 12 : hour12 + 12;
    }
    return hour24;
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

  const toggleCategory = (index: number) => {
    const updated = [...categoriesChecked];
    updated[index] = !updated[index];
    setCategoriesChecked(updated);
  };

  const handleGenerateIdeas = () => {
    if (!selectedDate) {
      Alert.alert("Missing Date", "Please select a date.");
      return;
    }

    const parsedPrice = Number.parseInt(maxPrice, 10);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Invalid Budget", "Please enter a valid budget.");
      return;
    }

    if (
      Number.isNaN(Number.parseInt(startHour12, 10)) ||
      Number.isNaN(Number.parseInt(endHour12, 10)) ||
      timesAreInvalid(startHour12, endHour12, startPeriod, endPeriod)
    ) {
      Alert.alert("Invalid Time", "Please enter valid start and end times.");
      return;
    }

    const parsedDistance = Number.parseInt(maxDistance, 10);
    if (Number.isNaN(parsedDistance) || parsedDistance < 0) {
      Alert.alert("Invalid Distance", "Please enter a valid distance.");
      return;
    }

    const selectedCategories = DATE_CATEGORIES.filter((_, i) => categoriesChecked[i]);
    if (!selectedCategories.length) {
      Alert.alert("No Categories", "Please select at least one category.");
      return;
    }

    const start24 = convertTo24Hour(Number.parseInt(startHour12, 10), startPeriod);
    const end24 = convertTo24Hour(Number.parseInt(endHour12, 10), endPeriod);
    const dateLengthHoursValue = Number.parseInt(dateLengthHours || "0", 10);
    const dateLengthMinutesValue = Number.parseInt(dateLengthMinutes || "0", 10);

    if (
      Number.isNaN(dateLengthHoursValue) ||
      Number.isNaN(dateLengthMinutesValue) ||
      dateLengthHoursValue < 0 ||
      dateLengthMinutesValue < 0
    ) {
      Alert.alert("Invalid Date Length", "Please enter a valid date length.");
      return;
    }

    const parsedDateLengthMinutes = dateLengthHoursValue * 60 + dateLengthMinutesValue;
    if (parsedDateLengthMinutes <= 0) {
      Alert.alert("Invalid Date Length", "Date length must be at least 1 minute.");
      return;
    }

    let windowDurationMinutes = (end24 - start24) * 60;
    if (windowDurationMinutes <= 0) {
      windowDurationMinutes += 24 * 60;
    }

    if (parsedDateLengthMinutes > windowDurationMinutes) {
      Alert.alert("Date Length Too Long", "Date length must fit inside your selected start and end times.");
      return;
    }

    const selectedDateIso = selectedDate.toISOString().slice(0, 10);

    let finalMaxDistance = parsedDistance;

    if (!actualUserLocation) {
      Alert.alert("Location Not Ready", "Your current location is not available yet. No places will be shown until it is loaded.");
      return;
    }

    const plannerParams = {
      maxPrice: parsedPrice,
      selectedDate: selectedDateIso,
      startHour: start24,
      endHour: end24,
      dateLengthMinutes: parsedDateLengthMinutes,
      maxDistance: finalMaxDistance,
      categories: selectedCategories,
      serverTarget,
      userLocation: actualUserLocation,
    };

    setIsGeneratingIdeas(true);
    addPlannedDate(selectedDateIso);
    setShowDatePicker(false);
    setIsModalVisible(false);

    void fetchPlacesFromOverpassWithCache(plannerParams);

    navigation.navigate("PlannedDateResults", plannerParams);

    setTimeout(() => setIsGeneratingIdeas(false), 500);
  };

  const openMarkDone = (idea: SavedDateIdea) => {
    if (!isUnlocked && getRecordedDates().length >= FREE_TIER_RECORDED_DATES_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    setMarkDoneIdea(idea);
    setMarkDoneWhoWith("");
    setMarkDoneDate(idea.selectedDate ? new Date(`${idea.selectedDate}T12:00:00`) : new Date());
    setMarkDoneMoneySpent("");
    setMarkDoneRating(null);
    setMarkDoneShowDatePicker(false);
  };

  const closeMarkDone = () => { setMarkDoneIdea(null); setMarkDoneShowDatePicker(false); };

  const submitMarkDone = () => {
    if (!markDoneIdea) return;
    if (!markDoneWhoWith.trim()) { Alert.alert("Required", "Please enter who you went with."); return; }
    const moneyValue = parseFloat(markDoneMoneySpent);
    addRecordedDate({
      dateOfDate: markDoneDate.toISOString().split("T")[0],
      imageUri: null,
      whoWentWith: markDoneWhoWith.trim(),
      whatYouDid: markDoneIdea.filledTemplate,
      moneySpent: Number.isNaN(moneyValue) ? -1 : moneyValue,
      rating: markDoneRating,
      whatYouLiked: "",
      whatYouLearned: "",
    });
    closeMarkDone();
    Alert.alert("Recorded!", "Date added to your history.");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 24,
          paddingTop: insets.top,
          paddingBottom: 48,
          backgroundColor: "transparent",
          flexGrow: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 36,
              color: "#1a1a1a",
              flex: 1,
              fontFamily: "SuperPandora",
            }}
          >
            Date Ideas
          </Text>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#eef5ff",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 6,
            }}
            onPress={() => setInfoVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 20, marginTop: -8 }}>
          Generate personalized date ideas based on your budget, time, and preferences.
        </Text>

        {/* <Image
          source={require("../assets/images/guy_asking_girl.jpg")}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            marginBottom: 24,
          }}
          resizeMode="cover"
        /> */}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsModalVisible(true)}
          style={{
            backgroundColor: "#1e90ff",
            borderRadius: 12,
            paddingVertical: 18,
            paddingHorizontal: 18,
            marginBottom: 18,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>Generate Date Ideas</Text>
        </TouchableOpacity>

        {/* Saved Ideas horizontal scroll */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 20, color: "#1a1a1a" }}>Saved Ideas</Text>
            {savedIdeas.length > 0 ? (
              <TouchableOpacity onPress={() => navigation.navigate("SavedIdeas")}>
                <Text style={{ fontSize: 14, color: "#1e90ff" }}>View All</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {savedIdeas.length === 0 ? (
            <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", padding: 20, alignItems: "center" }}>
              <Ionicons name="bookmark-outline" size={32} color="#c0c8d4" style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 14, color: "#9aa3af", textAlign: "center" }}>
                No saved ideas yet. Generate some date ideas and tap Save!
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {savedIdeas.map((idea) => {
                const cat = getIdeaCategory(idea.schedule || []);
                const cfg = (cat ? CATEGORY_CONFIG[cat] : null) ?? DEFAULT_CAT_CONFIG;
                return (
                  <TouchableOpacity
                    key={idea.id}
                    onPress={() => setSelectedIdea(idea)}
                    activeOpacity={0.8}
                    style={{
                      width: 220,
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      padding: 14,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: cfg.bg, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                      </View>
                      <Text style={{ fontSize: 12, color: cfg.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: "#1f2d3d", lineHeight: 20 }} numberOfLines={3}>
                      {idea.filledTemplate}
                    </Text>
                    {idea.selectedDate ? (
                      <Text style={{ fontSize: 12, color: "#9aa3af", marginTop: 8 }}>
                        {new Date(`${idea.selectedDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Inline calendar */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20, color: "#1a1a1a", marginBottom: 10 }}>Date Calendar</Text>
          <CalendarWidget onDayPress={handleCalendarDayPress} />
        </View>

        {/* Day detail modal */}
        <Modal visible={isDetailsModalVisible} transparent animationType="fade" onRequestClose={closeDateDetails}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", paddingHorizontal: 20 }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", maxHeight: "85%", overflow: "hidden" }}>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontSize: 20, color: "#1f2d3d", flex: 1, marginRight: 10 }}>
                    {selectedDateKey ? new Date(`${selectedDateKey}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : ""}
                  </Text>
                  <TouchableOpacity onPress={closeDateDetails}>
                    <Text style={{ color: "#1e90ff", fontSize: 16 }}>Close</Text>
                  </TouchableOpacity>
                </View>

                {selectedRecordedDates.length > 0 ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, color: "#ef4444", marginBottom: 8 }}>Recorded Dates</Text>
                    {selectedRecordedDates.map((entry, index) => (
                      <View key={entry.id} style={{ borderWidth: 1, borderColor: "#e8edf3", borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: "#fff" }}>
                        <Text style={{ color: "#1f2d3d", marginBottom: 3 }}>Date #{index + 1}</Text>
                        <Text style={{ color: "#4b5b6b", marginBottom: 2 }}>With: {entry.whoWentWith || "Not provided"}</Text>
                        <Text style={{ color: "#4b5b6b", marginBottom: 2 }}>Activity: {entry.whatYouDid || "Not provided"}</Text>
                        <Text style={{ color: "#4b5b6b", marginBottom: 2 }}>Spent: ${entry.moneySpent.toFixed(2)}</Text>
                        {entry.rating != null ? <Text style={{ color: "#4b5b6b" }}>Rating: {entry.rating}/10</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {selectedSavedIdeas.length > 0 ? (
                  <View>
                    <Text style={{ fontSize: 16, color: "#22c55e", marginBottom: 8 }}>Saved Date Ideas</Text>
                    {selectedSavedIdeas.map((entry, index) => (
                      <View key={entry.id} style={{ borderWidth: 1, borderColor: "#e8edf3", borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: "#fff" }}>
                        <Text style={{ color: "#1f2d3d", marginBottom: 3 }}>Saved Idea #{index + 1}</Text>
                        <Text style={{ color: "#4b5b6b", marginBottom: 2 }}>Idea: {entry.filledTemplate}</Text>
                        <Text style={{ color: "#4b5b6b" }}>Saved on {new Date(entry.savedAt).toLocaleDateString()}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {selectedRecordedDates.length === 0 && selectedSavedIdeas.length === 0 ? (
                  <Text style={{ color: "#4b5b6b" }}>No date details are available for this day.</Text>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {!isUnlocked ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPaywallVisible(true)}
            style={{
              backgroundColor: "#f0f7ff",
              borderRadius: 12,
              borderWidth: 2,
              borderColor: "#007AFF",
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ionicons name="star" size={28} color="#007AFF" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: "#007AFF",
                  marginBottom: 2,
                }}
              >
                Unlock Premium
              </Text>
              <Text style={{ fontSize: 13, color: "#0051D5" }}>
                Save unlimited ideas for only {lifetimePremium?.priceString || "..."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        ) : (
          <View
            style={{
              backgroundColor: "#eefaf0",
              borderRadius: 12,
              borderWidth: 2,
              borderColor: "#2e9f5b",
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ionicons name="checkmark-circle" size={28} color="#2e9f5b" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: "#2e9f5b",
                  marginBottom: 2,
                }}
              >
                You are a premium user
              </Text>
              <Text style={{ fontSize: 13, color: "#1f7a45" }}>You can save unlimited date ideas.</Text>
            </View>
          </View>
        )}

        <EditInputsModal
          visible={isModalVisible}
          onRequestClose={() => {
            setShowDatePicker(false);
            setIsModalVisible(false);
          }}
          editModalScrollRef={editModalScrollRef}
          showEditDatePicker={showDatePicker}
          setShowEditDatePicker={(v: boolean) => (v ? setShowDatePicker(true) : setShowDatePicker(false))}
          draftSelectedDate={selectedDate ? selectedDate.toISOString().slice(0, 10) : ""}
          setDraftSelectedDate={(iso) => {
            if (!iso) return;
            const parsed = new Date(`${iso}T12:00:00`);
            setSelectedDate(parsed);
          }}
          draftDateValue={selectedDate || new Date()}
          draftStartHour12={startHour12}
          setDraftStartHour12={(text: string) => {
            if (text.trim() === "") {
              setStartHour12("");
              return;
            }
            const parsed = Number.parseInt(text, 10);
            if (Number.isNaN(parsed)) {
              setStartHour12("");
              return;
            }
            setStartHour12(String(clampHour12(parsed)));
          }}
          draftStartPeriod={startPeriod}
          setDraftStartPeriod={setStartPeriod}
          draftEndHour12={endHour12}
          setDraftEndHour12={(text: string) => {
            if (text.trim() === "") {
              setEndHour12("");
              return;
            }
            const parsed = Number.parseInt(text, 10);
            if (Number.isNaN(parsed)) {
              setEndHour12("");
              return;
            }
            setEndHour12(String(clampHour12(parsed)));
          }}
          draftEndPeriod={endPeriod}
          setDraftEndPeriod={setEndPeriod}
          draftDateLengthHours={dateLengthHours}
          setDraftDateLengthHours={(text: string) => setDateLengthHours(sanitizeHourOrMinute(text, 23))}
          draftDateLengthMinutes={dateLengthMinutes}
          setDraftDateLengthMinutes={(text: string) => setDateLengthMinutes(sanitizeHourOrMinute(text, 59))}
          draftMaxPrice={maxPrice}
          setDraftMaxPrice={setMaxPrice}
          draftMaxDistance={maxDistance}
          setDraftMaxDistance={setMaxDistance}
          draftCategoriesChecked={categoriesChecked}
          toggleDraftCategory={toggleCategory}
          editError={null}
          applyEditsAndRegenerate={handleGenerateIdeas}
          handleEditInputFocus={() => {}}
        />

        <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />
      </ScrollView>

      {/* Saved idea detail popup */}
      <Modal visible={selectedIdea !== null} transparent animationType="slide" onRequestClose={() => setSelectedIdea(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
              {selectedIdea ? (() => {
                const cat = getIdeaCategory(selectedIdea.schedule || []);
                const cfg = (cat ? CATEGORY_CONFIG[cat] : null) ?? DEFAULT_CAT_CONFIG;
                return (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: cfg.bg, justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                    </View>
                    <Text style={{ fontSize: 15, color: cfg.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</Text>
                  </View>
                );
              })() : null}
              <TouchableOpacity onPress={() => setSelectedIdea(null)}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              {selectedIdea ? (
                <>
                  <Text style={{ fontSize: 16, color: "#1f2d3d", lineHeight: 24, marginBottom: 16 }}>
                    {selectedIdea.filledTemplate}
                  </Text>
                  {selectedIdea.schedule?.length ? (
                    <>
                      <Text style={{ fontSize: 13, color: "#8899aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Schedule</Text>
                      {selectedIdea.schedule.map((step, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 4 }}>
                          <Text style={{ color: "#e63f67", fontSize: 14, lineHeight: 22 }}>•</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, color: "#2c3e50" }}>{step.title}</Text>
                            {step.startTime && step.endTime ? (
                              <Text style={{ fontSize: 12, color: "#8899aa" }}>{step.startTime} – {step.endTime}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </>
                  ) : null}
                  {(() => {
                    const places = Object.values(selectedIdea.places || {}).filter((p): p is PlaceSummary => Boolean(p));
                    return places.length ? <IdeaPlaceLinks places={places} navigation={navigation} /> : null;
                  })()}
                </>
              ) : null}
            </ScrollView>

            {selectedIdea ? (
              <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (!selectedIdea) return;
                      const lines = (selectedIdea.schedule || [])
                        .map((s) => `• ${s.title}${s.startTime ? ` (${s.startTime}–${s.endTime})` : ""}`)
                        .join("\n");
                      Share.share({ message: lines ? `${selectedIdea.filledTemplate}\n\nSchedule:\n${lines}` : selectedIdea.filledTemplate, title: "Date Idea" });
                    }}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#dce6ef", borderRadius: 8, paddingVertical: 10 }}
                  >
                    <Ionicons name="share-outline" size={18} color="#4b5b6b" />
                    <Text style={{ fontSize: 14, color: "#4b5b6b" }}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Remove date idea?", "Are you sure you want to remove this saved idea?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: () => { removeSavedIdea(selectedIdea.id); setSelectedIdea(null); } },
                      ]);
                    }}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#fee2e2", borderRadius: 8, paddingVertical: 10, backgroundColor: "#fff5f5" }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc3545" />
                    <Text style={{ fontSize: 14, color: "#dc3545" }}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => { const idea = selectedIdea; setSelectedIdea(null); openMarkDone(idea); }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#edfaf2", borderRadius: 8, borderWidth: 1, borderColor: "#86efac", paddingVertical: 12 }}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16803c" />
                  <Text style={{ fontSize: 14, color: "#16803c" }}>We did this!</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Mark as done modal */}
      <Modal visible={markDoneIdea !== null} transparent animationType="slide" onRequestClose={closeMarkDone}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
              <Text style={{ fontSize: 20, color: "#1a1a1a" }}>We did this!</Text>
              <TouchableOpacity onPress={closeMarkDone}><Ionicons name="close" size={28} color="#1a1a1a" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }} keyboardShouldPersistTaps="handled">
              {markDoneIdea ? <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16, lineHeight: 20 }}>{markDoneIdea.filledTemplate}</Text> : null}
              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>When was the date? *</Text>
              <TouchableOpacity
                onPress={() => setMarkDoneShowDatePicker((p) => !p)}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8, backgroundColor: "#fafbfc" }}
              >
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={{ fontSize: 14, color: "#1a1a1a" }}>{formatDateShort(markDoneDate)}</Text>
              </TouchableOpacity>
              {markDoneShowDatePicker ? (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#dfe5eb", backgroundColor: "#f3f6fa", paddingHorizontal: 8, paddingVertical: 6, marginBottom: 8 }}>
                  <DateTimePicker
                    value={markDoneDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    onChange={(_, date) => { if (Platform.OS === "android") setMarkDoneShowDatePicker(false); if (date) setMarkDoneDate(date); }}
                    maximumDate={new Date()}
                    themeVariant="light"
                  />
                  {Platform.OS === "ios" ? (
                    <TouchableOpacity onPress={() => setMarkDoneShowDatePicker(false)} style={{ alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#dfe5eb" }}>
                      <Text style={{ color: "#007AFF", fontSize: 16 }}>Done</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8, marginTop: 8 }}>Who did you go with? *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 12, fontSize: 14, color: "#1a1a1a", backgroundColor: "#fafbfc", fontFamily: "System", marginBottom: 16 }}
                placeholder="Name(s)" placeholderTextColor="#999"
                value={markDoneWhoWith} onChangeText={setMarkDoneWhoWith}
              />
              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>How much did you spend?</Text>
              <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, backgroundColor: "#fafbfc", marginBottom: 16 }}>
                <Text style={{ fontSize: 16, color: "#1a1a1a", paddingHorizontal: 12 }}>$</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: "#1a1a1a", fontFamily: "System" }}
                  placeholder="0.00" placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={markDoneMoneySpent} onChangeText={setMarkDoneMoneySpent}
                />
              </View>
              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>Rate the date (1–10)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => {
                  const color = getRatingColor(n);
                  const selected = markDoneRating === n;
                  return (
                    <TouchableOpacity key={n} onPress={() => setMarkDoneRating(selected ? null : n)}
                      style={{ width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: color, alignItems: "center", justifyContent: "center", backgroundColor: selected ? color : "#fafbfc" }}>
                      <Text style={{ color: selected ? "#fff" : color, fontSize: 14 }}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingTop: 12 }}>
              <TouchableOpacity onPress={closeMarkDone} style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 16, color: "#666" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitMarkDone} style={{ flex: 1, backgroundColor: "#007AFF", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 16, color: "#fff" }}>Save to History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PageInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description="Use this page to generate date ideas based on your budget, time window, categories, and distance."
        bullets={[
          "Tap Generate Date Ideas to open filters and preferences.",
          "Choose your date, budget, timing, and categories to tailor suggestions.",
          "Open Date Calendar to review planned and recorded dates.",
        ]}
      />
    </KeyboardAvoidingView>
  );
}
