import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, TextInput, TouchableOpacity, View } from "react-native";
import Text from "../Components/AppText";
import { Ionicons } from "@expo/vector-icons";
import type { AppNavigation } from "../types/navigation";
import IdeaPlaceLinks from "../Components/IdeaPlaceLinks";
import { getActivityById } from "../data/activities";
import type { PlaceSummary } from "../hooks/useDatePlannerIdeas";
import {
  FREE_TIER_SAVED_IDEAS_LIMIT,
  getSavedIdeas,
  initializeSavedIdeas,
  removeSavedIdea,
  subscribeSavedIdeas,
  type SavedDateIdea,
} from "../data/savedIdeasStore";
import { addRecordedDate, FREE_TIER_RECORDED_DATES_LIMIT, getRecordedDates, initializeRecordedDates } from "../data/dateHistoryStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "../Components/PaywallModal";
import usePurchases from "src/hooks/usePurchases";
import PageInfoModal from "../Components/PageInfoModal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SLOT_TO_CATEGORY } from "../utils/utils";

type SortBy = "newest" | "date-asc" | "date-desc";

function getIdeaCategory(schedule: Array<{ slot: string; place?: PlaceSummary | null }>): string | null {
  const weights: Record<string, number> = {};
  for (const step of schedule) {
    if (step.place?.sourceKind === "activity" && step.place.id) {
      const activity = getActivityById(step.place.id);
      if (activity) {
        const primaryCat = activity.categories.find((c) => c !== "Entertainment") ?? activity.categories[0];
        if (primaryCat) weights[primaryCat] = (weights[primaryCat] ?? 0) + 1;
      }
    } else if (step.place?.sourceKind === "place" && step.place.type) {
      const cat = SLOT_TO_CATEGORY[step.place.type];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 2;
    } else {
      for (const part of step.slot.split("|").map((s) => s.trim())) {
        const cat = SLOT_TO_CATEGORY[part];
        if (cat) weights[cat] = (weights[cat] ?? 0) + 1;
      }
    }
  }
  let best: string | null = null, bestW = 0;
  for (const [cat, w] of Object.entries(weights)) {
    if (w > bestW) { best = cat; bestW = w; }
  }
  return best;
}

function getRatingColor(n: number): string {
  const hue = Math.round(((n - 1) / 9) * 120);
  return `hsl(${hue}, 72%, 40%)`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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

export default function SavedIdeas({ navigation }: { navigation: AppNavigation }) {
  const { lifetimePremium } = usePurchases();
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>([]);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const { isUnlocked } = usePremium();
  const insets = useSafeAreaInsets();

  // Sort / filter
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Detail popup
  const [selectedIdea, setSelectedIdea] = useState<SavedDateIdea | null>(null);

  // Mark as done form
  const [markDoneIdea, setMarkDoneIdea] = useState<SavedDateIdea | null>(null);
  const [markDoneWhoWith, setMarkDoneWhoWith] = useState("");
  const [markDoneDate, setMarkDoneDate] = useState(new Date());
  const [markDoneMoneySpent, setMarkDoneMoneySpent] = useState("");
  const [markDoneRating, setMarkDoneRating] = useState<number | null>(null);
  const [markDoneShowDatePicker, setMarkDoneShowDatePicker] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      if (!isMounted) return;
      setSavedIdeas(getSavedIdeas());
    };
    void initializeSavedIdeas().then(load);
    const unsubscribe = subscribeSavedIdeas(load);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    void initializeRecordedDates();
  }, []);

  const displayedIdeas = useMemo(() => {
    let ideas = [...savedIdeas];
    if (filterCategory) {
      ideas = ideas.filter((idea) => getIdeaCategory(idea.schedule || []) === filterCategory);
    }
    if (sortBy === "newest") {
      ideas.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } else if (sortBy === "date-asc") {
      ideas.sort((a, b) => (a.selectedDate ?? "9999").localeCompare(b.selectedDate ?? "9999"));
    } else {
      ideas.sort((a, b) => (b.selectedDate ?? "").localeCompare(a.selectedDate ?? ""));
    }
    return ideas;
  }, [savedIdeas, sortBy, filterCategory]);

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

  const closeMarkDone = () => {
    setMarkDoneIdea(null);
    setMarkDoneShowDatePicker(false);
  };

  const submitMarkDone = () => {
    if (!markDoneIdea) return;
    if (!markDoneWhoWith.trim()) {
      Alert.alert("Required", "Please enter who you went with.");
      return;
    }
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
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 12,
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 8,
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 36,
              color: "#1a1a1a",
            }}
          >
            Saved Ideas
          </Text>
          {!isUnlocked ? (
            <Text
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              {savedIdeas.length} out of {FREE_TIER_SAVED_IDEAS_LIMIT} used
            </Text>
          ) : null}
        </View>
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

      <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>Your favorite generated date ideas, saved for later.</Text>

      <Image
        source={require("../assets/images/thinking.jpg")}
        style={{
          width: "100%",
          height: 200,
          borderRadius: 12,
          marginBottom: 20,
        }}
      />

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
            <Text style={{ fontSize: 13, color: "#0051D5" }}>Save unlimited ideas for only {lifetimePremium?.priceString || "..."}</Text>
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

      {/* Sort chips */}
      {savedIdeas.length > 1 ? (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {(["newest", "date-asc", "date-desc"] as SortBy[]).map((s) => {
            const label = s === "newest" ? "Newest" : s === "date-asc" ? "Date ↑" : "Date ↓";
            const active = sortBy === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSortBy(s)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? "#1e90ff" : "#dce6ef",
                  backgroundColor: active ? "#eff6ff" : "#fff",
                }}
              >
                <Text style={{ fontSize: 13, color: active ? "#1e90ff" : "#6b7280" }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Category filter chips */}
      {savedIdeas.length > 1 ? (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[null, "Food", "Outdoors", "Sports", "Education", "Shopping", "Entertainment"].map((cat) => {
            const active = filterCategory === cat;
            const label = cat ?? "All";
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setFilterCategory(cat)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? "#7c3aed" : "#dce6ef",
                  backgroundColor: active ? "#f3eeff" : "#fff",
                }}
              >
                <Text style={{ fontSize: 13, color: active ? "#7c3aed" : "#6b7280" }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {savedIdeas.length === 0 ? (
        <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", padding: 16 }}>
          <Text style={{ color: "#4b5b6b", fontSize: 16 }}>No saved date ideas yet. Save one from Planned Date Results.</Text>
        </View>
      ) : displayedIdeas.length === 0 ? (
        <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", padding: 16 }}>
          <Text style={{ color: "#4b5b6b", fontSize: 16 }}>No ideas match the current filter.</Text>
        </View>
      ) : null}

      {displayedIdeas.map((idea) => {
        const cat = getIdeaCategory(idea.schedule || []);
        const cfg = (cat ? CATEGORY_CONFIG[cat] : null) ?? DEFAULT_CONFIG;
        const dateLabel = idea.selectedDate
          ? new Date(`${idea.selectedDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null;
        return (
          <TouchableOpacity
            key={idea.id}
            onPress={() => setSelectedIdea(idea)}
            activeOpacity={0.75}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#dce6ef",
              padding: 14,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: cfg.bg, justifyContent: "center", alignItems: "center" }}
            >
              <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: "#1f2d3d" }} numberOfLines={2}>
                {idea.filledTemplate}
              </Text>
              {dateLabel ? <Text style={{ fontSize: 12, color: "#8899aa", marginTop: 2 }}>{dateLabel}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#b0bec5" />
          </TouchableOpacity>
        );
      })}

      {/* Idea detail popup */}
      <Modal visible={selectedIdea !== null} transparent animationType="slide" onRequestClose={() => setSelectedIdea(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              {selectedIdea
                ? (() => {
                    const cat = getIdeaCategory(selectedIdea.schedule || []);
                    const cfg = (cat ? CATEGORY_CONFIG[cat] : null) ?? DEFAULT_CONFIG;
                    return (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: cfg.bg,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                        </View>
                        <Text style={{ fontSize: 15, color: cfg.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</Text>
                      </View>
                    );
                  })()
                : null}
              <TouchableOpacity onPress={() => setSelectedIdea(null)}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              {selectedIdea ? (
                <>
                  <Text style={{ fontSize: 16, color: "#1f2d3d", lineHeight: 24, marginBottom: 16 }}>{selectedIdea.filledTemplate}</Text>

                  {selectedIdea.schedule?.length ? (
                    <>
                      <Text style={{ fontSize: 13, color: "#8899aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                        Schedule
                      </Text>
                      {selectedIdea.schedule.map((step, i) => (
                        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 4 }}>
                          <Text style={{ color: "#e63f67", fontSize: 14, lineHeight: 22 }}>•</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, color: "#2c3e50" }}>{step.title}</Text>
                            {step.startTime && step.endTime ? (
                              <Text style={{ fontSize: 12, color: "#8899aa" }}>
                                {step.startTime} – {step.endTime}
                              </Text>
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
                      Share.share({
                        message: lines ? `${selectedIdea.filledTemplate}\n\nSchedule:\n${lines}` : selectedIdea.filledTemplate,
                        title: "Date Idea",
                      });
                    }}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 8,
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons name="share-outline" size={18} color="#4b5b6b" />
                    <Text style={{ fontSize: 14, color: "#4b5b6b" }}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Remove date idea?", "Are you sure you want to remove this saved idea?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => {
                            removeSavedIdea(selectedIdea.id);
                            setSelectedIdea(null);
                          },
                        },
                      ]);
                    }}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      borderWidth: 1,
                      borderColor: "#fee2e2",
                      borderRadius: 8,
                      paddingVertical: 10,
                      backgroundColor: "#fff5f5",
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc3545" />
                    <Text style={{ fontSize: 14, color: "#dc3545" }}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const idea = selectedIdea;
                    setSelectedIdea(null);
                    openMarkDone(idea);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: "#edfaf2",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#86efac",
                    paddingVertical: 12,
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16803c" />
                  <Text style={{ fontSize: 14, color: "#16803c" }}>We did this!</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />
      <PageInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description="This page stores date ideas you saved from generated results so you can revisit them anytime."
        bullets={[
          "Open any card to view all activities, places, and timing details.",
          "Tap Remove if you no longer want to keep an idea.",
          "Your saved ideas are stored on-device and loaded when the app opens.",
        ]}
      />

      {/* Mark as done modal */}
      <Modal visible={markDoneIdea !== null} transparent animationType="slide" onRequestClose={closeMarkDone}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              <Text style={{ fontSize: 20, color: "#1a1a1a" }}>We did this!</Text>
              <TouchableOpacity onPress={closeMarkDone}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }} keyboardShouldPersistTaps="handled">
              {markDoneIdea ? (
                <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16, lineHeight: 20 }}>{markDoneIdea.filledTemplate}</Text>
              ) : null}

              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>When was the date? *</Text>
              <TouchableOpacity
                onPress={() => setMarkDoneShowDatePicker((p) => !p)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginBottom: 8,
                  backgroundColor: "#fafbfc",
                }}
              >
                <Ionicons name="calendar" size={20} color="#007AFF" />
                <Text style={{ fontSize: 14, color: "#1a1a1a" }}>{formatDateShort(markDoneDate)}</Text>
              </TouchableOpacity>
              {markDoneShowDatePicker ? (
                <View
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#dfe5eb",
                    backgroundColor: "#f3f6fa",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    marginBottom: 8,
                  }}
                >
                  <DateTimePicker
                    value={markDoneDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    onChange={(_, date) => {
                      if (Platform.OS === "android") setMarkDoneShowDatePicker(false);
                      if (date) setMarkDoneDate(date);
                    }}
                    maximumDate={new Date()}
                    themeVariant="light"
                  />
                  {Platform.OS === "ios" ? (
                    <TouchableOpacity
                      onPress={() => setMarkDoneShowDatePicker(false)}
                      style={{ alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#dfe5eb" }}
                    >
                      <Text style={{ color: "#007AFF", fontSize: 16 }}>Done</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8, marginTop: 8 }}>Who did you go with? *</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  color: "#1a1a1a",
                  backgroundColor: "#fafbfc",
                  fontFamily: "System",
                  marginBottom: 16,
                }}
                placeholder="Name(s)"
                placeholderTextColor="#999"
                value={markDoneWhoWith}
                onChangeText={setMarkDoneWhoWith}
              />

              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>How much did you spend?</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  backgroundColor: "#fafbfc",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, color: "#1a1a1a", paddingHorizontal: 12 }}>$</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: "#1a1a1a", fontFamily: "System" }}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={markDoneMoneySpent}
                  onChangeText={setMarkDoneMoneySpent}
                />
              </View>

              <Text style={{ fontSize: 14, color: "#1a1a1a", marginBottom: 8 }}>Rate the date (1–10)</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                  const color = getRatingColor(n);
                  const selected = markDoneRating === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setMarkDoneRating(selected ? null : n)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: color,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected ? color : "#fafbfc",
                      }}
                    >
                      <Text style={{ color: selected ? "#fff" : color, fontSize: 14 }}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={closeMarkDone}
                style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, color: "#666" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitMarkDone}
                style={{ flex: 1, backgroundColor: "#007AFF", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 16, color: "#fff" }}>Save to History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
