import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Dimensions, Platform, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getActivityById } from "../data/activities";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AdEventType, InterstitialAd, TestIds } from "react-native-google-mobile-ads";
import * as Location from "expo-location";
import Text from "../Components/AppText";
import Ionicons from "@expo/vector-icons/Ionicons";
import useDatePlannerIdeas from "../hooks/useDatePlannerIdeas";
import useFilledIdeas, { type FilledIdea } from "../hooks/useFilledIdeas";
import { canSaveIdea, saveDateIdea, subscribeSavedIdeas, initializeSavedIdeas } from "../data/savedIdeasStore";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "../Components/PaywallModal";
import IdeaPlaceLinks from "../Components/IdeaPlaceLinks";
import type { AppNavigation } from "../types/navigation";
import { DATE_CATEGORIES, SLOT_TO_CATEGORY } from "../utils/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomBackgroundArt from "../Components/BottomBackgroundArt";

const ANDROID_INTERSTITIAL_ID = "ca-app-pub-9592701510571371/3901794551";
const IOS_INTERSTITIAL_ID = "ca-app-pub-9592701510571371/5004294097";
const PRODUCTION_INTERSTITIAL_ID = Platform.select({ android: ANDROID_INTERSTITIAL_ID, ios: IOS_INTERSTITIAL_ID });
const INTERSTITIAL_AD_UNIT_ID = __DEV__ || !PRODUCTION_INTERSTITIAL_ID ? TestIds.INTERSTITIAL : PRODUCTION_INTERSTITIAL_ID;

const AD_EVERY_N_CARDS = 10;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.50);

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; deepColor: string; bg: string; label: string }> = {
  Food:          { icon: "restaurant",  color: "#d4522a", deepColor: "#a83a1a", bg: "#fef0e8", label: "Food" },
  Sports:        { icon: "barbell",     color: "#16803c", deepColor: "#0e5828", bg: "#edfaf2", label: "Sports" },
  Outdoors:      { icon: "leaf",        color: "#0d7560", deepColor: "#095446", bg: "#e6f4f0", label: "Outdoors" },
  Education:     { icon: "book",        color: "#5746af", deepColor: "#3d3182", bg: "#eeebff", label: "Education" },
  Shopping:      { icon: "bag-handle",  color: "#b45309", deepColor: "#8a3e06", bg: "#fef8e8", label: "Shopping" },
  Entertainment: { icon: "film",        color: "#7c3aed", deepColor: "#5b22c4", bg: "#f3eeff", label: "Entertainment" },
};
const DEFAULT_CAT = { icon: "heart", color: "#e63f67", deepColor: "#b82e51", bg: "#fff0f5", label: "Date" };

const DURATION_OPTIONS = [
  { label: "1 hr", value: 60 },
  { label: "2 hrs", value: 120 },
  { label: "3 hrs", value: 180 },
  { label: "4+ hrs", value: 240 },
] as const;

const BUDGET_OPTIONS = [
  { label: "Free", value: 0 },
  { label: "$10", value: 10 },
  { label: "$25", value: 25 },
  { label: "$50", value: 50 },
  { label: "$100+", value: 100 },
] as const;

interface Filters {
  categories: string[];
  selectedDate: string;
  startHour: number;
  endHour: number;
  dateLengthMinutes: number;
  maxPrice: number;
}

function makeDefaultFilters(): Filters {
  return {
    categories: [...DATE_CATEGORIES] as string[],
    selectedDate: new Date().toISOString().slice(0, 10),
    startHour: 10,
    endHour: 22,
    dateLengthMinutes: 180,
    maxPrice: 50,
  };
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function getIdeaCategory(idea: FilledIdea): string | null {
  const weights: Record<string, number> = {};
  for (const step of idea.schedule ?? []) {
    if (step.place?.sourceKind === "activity" && step.place.id) {
      const activity = getActivityById(step.place.id);
      if (activity) {
        const primaryCat = activity.categories.find((c) => c !== "Entertainment") ?? activity.categories[0];
        if (primaryCat && CATEGORY_CONFIG[primaryCat]) {
          weights[primaryCat] = (weights[primaryCat] ?? 0) + 1;
        }
      }
    } else if (step.place?.sourceKind === "place" && step.place.type) {
      const cat = SLOT_TO_CATEGORY[step.place.type];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 2;
    } else {
      const cat = SLOT_TO_CATEGORY[step.slot];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 1;
    }
  }
  let best: string | null = null;
  let bestW = 0;
  for (const [cat, w] of Object.entries(weights)) {
    if (w > bestW) { best = cat; bestW = w; }
  }
  return best;
}

function getStepCategory(
  step: { slot: string; place: { sourceKind: string; id?: string; type?: string } | null },
  stepIndex: number
): (typeof DEFAULT_CAT) {
  let cat: string | null = null;
  if (step.place?.sourceKind === "activity" && step.place.id) {
    const activity = getActivityById(step.place.id);
    if (activity) {
      const validCats = activity.categories.filter((c) => CATEGORY_CONFIG[c]);
      if (validCats.length > 0) cat = validCats[stepIndex % validCats.length];
    }
  } else if (step.place?.sourceKind === "place" && step.place.type) {
    cat = SLOT_TO_CATEGORY[step.place.type] ?? null;
  }
  if (!cat) cat = SLOT_TO_CATEGORY[step.slot] ?? null;
  return (cat && CATEGORY_CONFIG[cat]) || DEFAULT_CAT;
}

export default function SwipeIdeas({
  navigation,
}: {
  navigation: AppNavigation;
  goToTab?: (key: string) => void;
  onCardSwipeActive?: (active: boolean) => void;
}) {
  const { isUnlocked } = usePremium();
  const insets = useSafeAreaInsets();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [canSave, setCanSave] = useState(() => canSaveIdea(isUnlocked));
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [activityModalId, setActivityModalId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>(makeDefaultFilters);
  const [filterVisible, setFilterVisible] = useState(false);
  const [draft, setDraft] = useState<Filters>(makeDefaultFilters);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const cardCountRef = useRef(0);
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const interstitialReadyRef = useRef(false);

  useEffect(() => {
    if (isUnlocked) return;
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);
    interstitialRef.current = ad;
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => { interstitialReadyRef.current = true; });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => { interstitialReadyRef.current = false; ad.load(); });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => { interstitialReadyRef.current = false; });
    ad.load();
    return () => { unsubLoaded(); unsubClosed(); unsubError(); };
  }, [isUnlocked]);

  const hasLocation = userLocation !== null;

  const params = useMemo(
    () => ({
      maxPrice: filters.maxPrice,
      selectedDate: filters.selectedDate,
      startHour: filters.startHour,
      endHour: filters.endHour,
      dateLengthMinutes: filters.dateLengthMinutes,
      maxDistance: isUnlocked ? 10 : 5,
      categories: filters.categories,
      serverTarget: "overpass" as const,
      userLocation,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, isUnlocked, hasLocation],
  );

  const { places, recipes, activities, isLoading } = useDatePlannerIdeas(params);
  const memoizedPlaces = useMemo(() => [...places], [places, generationCount]);
  const ideas = useFilledIdeas({ params, places: memoizedPlaces, recipes, activities });

  useEffect(() => {
    Location.getLastKnownPositionAsync()
      .then((pos) => {
        if (pos) setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void initializeSavedIdeas();
    return subscribeSavedIdeas(() => setCanSave(canSaveIdea(isUnlocked)));
  }, [isUnlocked]);

  const hasActiveFilters = useMemo(() => {
    const def = makeDefaultFilters();
    return (
      filters.categories.length !== def.categories.length ||
      filters.selectedDate !== def.selectedDate ||
      filters.startHour !== def.startHour ||
      filters.endHour !== def.endHour ||
      filters.dateLengthMinutes !== def.dateLengthMinutes ||
      filters.maxPrice !== def.maxPrice
    );
  }, [filters]);

  const openFilter = useCallback(() => {
    setDraft({ ...filters });
    setShowDatePicker(false);
    setFilterVisible(true);
  }, [filters]);

  const applyFilter = useCallback(() => {
    setFilters(draft);
    setFilterVisible(false);
    setGenerationCount((c) => c + 1);
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraft(makeDefaultFilters());
    setShowDatePicker(false);
  }, []);

  const toggleDraftCategory = useCallback((cat: string) => {
    setDraft((d) => {
      const has = d.categories.includes(cat);
      if (has && d.categories.length === 1) return d;
      return { ...d, categories: has ? d.categories.filter((c) => c !== cat) : [...d.categories, cat] };
    });
  }, []);

  const advance = useCallback(() => {
    cardCountRef.current += 1;
    if (!isUnlocked && cardCountRef.current % AD_EVERY_N_CARDS === 0) {
      if (interstitialReadyRef.current && interstitialRef.current) {
        interstitialRef.current.show();
      }
    }
    setCurrentIndex((p) => p + 1);
  }, [isUnlocked]);

  const handleSave = useCallback(() => {
    const idea = ideas[currentIndex];
    if (!idea) return;
    if (!canSave) {
      setPaywallVisible(true);
      return;
    }
    saveDateIdea(idea);
    advance();
  }, [ideas, currentIndex, canSave, advance]);

  const handleSkip = useCallback(() => {
    if (!ideas[currentIndex]) return;
    advance();
  }, [ideas, currentIndex, advance]);

  const currentIdea = ideas[currentIndex];
  const category = currentIdea ? getIdeaCategory(currentIdea) : null;
  const catConfig = (category && CATEGORY_CONFIG[category]) || DEFAULT_CAT;

  if (isLoading && ideas.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <BottomBackgroundArt bottomOffset={0} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.loadingText}>Finding date ideas nearby…</Text>
        </View>
      </View>
    );
  }

  if (!currentIdea) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <BottomBackgroundArt bottomOffset={0} />
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={72} color="#22c55e" />
          <Text style={styles.doneTitle}>Thanks for watching the ads — it helps keep this app free!</Text>
          <TouchableOpacity
            style={styles.restartBtn}
            onPress={() => {
              setCurrentIndex(0);
              setGenerationCount((c) => c + 1);
            }}
          >
            <Text style={styles.restartBtnText}>Generate More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.savedLink} onPress={() => navigation.navigate("SavedIdeas")}>
            <Ionicons name="heart" size={15} color="#e63f67" />
            <Text style={styles.savedLinkText}>View Saved Ideas</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const steps = currentIdea.schedule ?? [];

  return (
    <View style={styles.container}>
      {/* Full-screen card */}
      <View style={styles.card}>
        {/* Hero section */}
        <View style={[styles.cardHero, { height: HERO_HEIGHT }]}>
          <LinearGradient
            colors={[catConfig.deepColor, catConfig.color]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Header overlaid at top of hero */}
          <View style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.heroHeaderTitle}>Discover</Text>
            <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
              <Ionicons name="options-outline" size={20} color={hasActiveFilters ? "#fff" : "rgba(255,255,255,0.75)"} />
              {hasActiveFilters && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {Array.from({ length: Math.min(steps.length, 5) }).map((_, i) => (
              <View key={i} style={[styles.progressDot, i === 0 && styles.progressDotActive]} />
            ))}
          </View>

          {/* Category icon */}
          <View style={styles.heroIconCircle}>
            <Ionicons name={catConfig.icon as any} size={52} color="white" />
          </View>

          {/* Bottom gradient with title */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.80)"]}
            style={styles.heroOverlay}
          >
            <View style={styles.heroCatPill}>
              <Ionicons name={catConfig.icon as any} size={10} color="rgba(255,255,255,0.92)" />
              <Text style={styles.heroCatText}>{catConfig.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={3}>{currentIdea.filledTemplate}</Text>
          </LinearGradient>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scheduleWrap}>
            {steps.slice(0, 6).map((step, i) => {
              const stepCat = getStepCategory(step, i);
              return (
                <View key={i} style={[styles.stepPill, { backgroundColor: stepCat.bg }]}>
                  <Ionicons name={stepCat.icon as any} size={12} color={stepCat.color} />
                  <Text style={[styles.stepPillText, { color: stepCat.deepColor }]} numberOfLines={1}>
                    {step.title}
                  </Text>
                  {step.durationMinutes > 0 && (
                    <Text style={styles.stepDuration}>{formatDuration(step.durationMinutes)}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {Object.keys(currentIdea.places ?? {}).length > 0 && (
            <>
              <View style={styles.linkDivider} />
              <IdeaPlaceLinks
                places={Object.values(currentIdea.places ?? {})}
                navigation={navigation}
                marginTop={0}
                onActivityPress={(p) => setActivityModalId(p.id)}
              />
            </>
          )}
        </ScrollView>
      </View>

      {/* Action buttons */}
      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.btnWrapper}>
          <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={handleSkip}>
            <Ionicons name="close" size={38} color="#ef4444" />
          </TouchableOpacity>
          <Text style={styles.btnLabel}>Pass</Text>
        </View>
        <TouchableOpacity style={styles.btnBookmark} onPress={() => navigation.navigate("SavedIdeas")}>
          <Ionicons name="bookmark-outline" size={22} color="#666" />
        </TouchableOpacity>
        <View style={styles.btnWrapper}>
          <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
            <Ionicons name="heart" size={38} color="#22c55e" />
          </TouchableOpacity>
          <Text style={styles.btnLabel}>Save</Text>
        </View>
      </View>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />

      {/* Filter sheet */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.filterSheet}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={resetDraft}>
                <Text style={styles.filterReset}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={styles.filterSectionLabel}>Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker((v) => !v)}>
                <Ionicons name="calendar-outline" size={16} color="#555" />
                <Text style={styles.dateBtnText}>{formatDate(draft.selectedDate)}</Text>
                <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={16} color="#999" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(draft.selectedDate + "T12:00:00")}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date()}
                  onChange={(_event, date) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (date) setDraft((d) => ({ ...d, selectedDate: date.toISOString().slice(0, 10) }));
                  }}
                />
              )}

              <Text style={styles.filterSectionLabel}>Time Window</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeStepper}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setDraft((d) => ({ ...d, startHour: Math.max(0, d.startHour - 1) }))}>
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{formatHour(draft.startHour)}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setDraft((d) => ({ ...d, startHour: Math.min(d.endHour - 1, d.startHour + 1) }))}>
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#bbb" style={{ marginTop: 20 }} />
                <View style={styles.timeStepper}>
                  <Text style={styles.timeLabel}>End</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setDraft((d) => ({ ...d, endHour: Math.max(d.startHour + 1, d.endHour - 1) }))}>
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{formatHour(draft.endHour)}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setDraft((d) => ({ ...d, endHour: Math.min(23, d.endHour + 1) }))}>
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.filterSectionLabel}>Duration</Text>
              <View style={styles.chipRow}>
                {DURATION_OPTIONS.map((opt) => {
                  const active = draft.dateLengthMinutes === opt.value;
                  return (
                    <TouchableOpacity key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setDraft((d) => ({ ...d, dateLengthMinutes: opt.value }))}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterSectionLabel}>Budget</Text>
              <View style={styles.chipRow}>
                {BUDGET_OPTIONS.map((opt) => {
                  const active = draft.maxPrice === opt.value;
                  return (
                    <TouchableOpacity key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setDraft((d) => ({ ...d, maxPrice: opt.value }))}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.filterSectionLabel}>Categories</Text>
              <View style={styles.catGrid}>
                {(DATE_CATEGORIES as readonly string[]).map((cat) => {
                  const active = draft.categories.includes(cat);
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <TouchableOpacity key={cat} style={[styles.catChip, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]} onPress={() => toggleDraftCategory(cat)}>
                      <Ionicons name={cfg.icon as any} size={14} color={active ? cfg.color : "#999"} />
                      <Text style={[styles.catChipText, active && { color: cfg.color }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Activity detail sheet */}
      <Modal visible={activityModalId !== null} transparent animationType="slide" onRequestClose={() => setActivityModalId(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActivityModalId(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            {(() => {
              const activity = activityModalId ? getActivityById(activityModalId) : null;
              if (!activity) return null;
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{activity.name}</Text>
                  <Text style={styles.modalDesc}>{activity.description}</Text>
                  <View style={styles.modalStats}>
                    <View style={styles.modalStatBox}>
                      <Text style={styles.modalStatLabel}>Cost</Text>
                      <Text style={styles.modalStatValue}>{activity.cost <= 0 ? "Free" : `$${activity.cost}`}</Text>
                    </View>
                    <View style={styles.modalStatBox}>
                      <Text style={styles.modalStatLabel}>Duration</Text>
                      <Text style={styles.modalStatValue}>{activity.durationMinutes.min}–{activity.durationMinutes.max} min</Text>
                    </View>
                  </View>
                  {activity.categories.length > 0 && (
                    <View style={styles.modalTags}>
                      {activity.categories.map((cat) => (
                        <View key={cat} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{cat}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  loadingText: { marginTop: 18, color: "#6b7280", fontSize: 15, textAlign: "center" },
  doneTitle: { fontSize: 22, color: "#1a1a1a", marginTop: 20, textAlign: "center", lineHeight: 30 },
  restartBtn: { marginTop: 28, backgroundColor: "#1e90ff", borderRadius: 14, paddingHorizontal: 36, paddingVertical: 14 },
  restartBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  savedLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
  savedLinkText: { color: "#e63f67", fontSize: 15, fontWeight: "500" },

  // Full-screen card
  card: {
    flex: 1,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  // Hero
  cardHero: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  heroHeaderTitle: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "SuperPandora",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  progressDots: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    zIndex: 5,
    paddingHorizontal: 24,
  },
  progressDot: {
    height: 3,
    flex: 1,
    maxWidth: 40,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  progressDotActive: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  heroIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
    marginBottom: 60,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  heroCatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  heroCatText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 32,
  },

  // Content
  contentScroll: { flex: 1 },
  cardContent: {
    padding: 20,
    paddingTop: 18,
  },
  scheduleWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: SCREEN_WIDTH * 0.30,
  },
  stepDuration: {
    fontSize: 11,
    color: "#9ca3af",
  },
  linkDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginTop: 16,
    marginBottom: 4,
  },

  // Action buttons
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingTop: 12,
    paddingHorizontal: 32,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  btnWrapper: { alignItems: "center", gap: 5 },
  btnLabel: { fontSize: 12, fontWeight: "600", color: "#888" },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  btnSkip: { backgroundColor: "#fff", shadowColor: "#ef4444", shadowOpacity: 0.16 },
  btnSave: { backgroundColor: "#fff", shadowColor: "#22c55e", shadowOpacity: 0.20 },
  btnBookmark: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },

  // Shared modal overlay
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },

  // Filter sheet
  filterSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: "88%",
  },
  filterHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  filterTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  filterReset: { fontSize: 15, color: "#1e90ff" },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 10,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateBtnText: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  timeRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  timeStepper: { flex: 1, alignItems: "center" },
  timeLabel: { fontSize: 13, color: "#888", marginBottom: 6 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", minWidth: 52, textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "#f0f0f0", borderWidth: 1.5, borderColor: "transparent" },
  chipActive: { backgroundColor: "#e8f0fe", borderColor: "#1e90ff" },
  chipText: { fontSize: 14, color: "#555", fontWeight: "500" },
  chipTextActive: { color: "#1e90ff" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  catChipText: { fontSize: 14, color: "#999", fontWeight: "500" },
  applyBtn: { marginTop: 24, backgroundColor: "#1e90ff", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Activity detail sheet
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 24, color: "#1a1a1a", marginBottom: 10, fontFamily: "SuperPandora" },
  modalDesc: { fontSize: 15, lineHeight: 22, color: "#555", marginBottom: 18 },
  modalStats: { flexDirection: "row", gap: 12, marginBottom: 16 },
  modalStatBox: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 12, alignItems: "center" },
  modalStatLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  modalStatValue: { fontSize: 16, color: "#1a1a1a", fontWeight: "600" },
  modalTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalTag: { backgroundColor: "#ede9fe", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  modalTagText: { fontSize: 13, color: "#6d28d9" },
});
