import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { getActivityById } from "../data/activities";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PanGestureHandler, State } from "react-native-gesture-handler";
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

const AD_EVERY_N_SWIPES = 10;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  Food: { icon: "restaurant", color: "#d4522a", bg: "#fef0e8", label: "Food" },
  Sports: { icon: "barbell", color: "#16803c", bg: "#edfaf2", label: "Sports" },
  Outdoors: { icon: "leaf", color: "#0d7560", bg: "#e6f4f0", label: "Outdoors" },
  Education: { icon: "book", color: "#5746af", bg: "#eeebff", label: "Education" },
  Shopping: { icon: "bag-handle", color: "#b45309", bg: "#fef8e8", label: "Shopping" },
  Entertainment: { icon: "film", color: "#7c3aed", bg: "#f3eeff", label: "Entertainment" },
};
const DEFAULT_CAT = { icon: "heart", color: "#e63f67", bg: "#fff0f5", label: "Date" };

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

function getIdeaCategory(idea: FilledIdea): string | null {
  const weights: Record<string, number> = {};
  for (const step of idea.schedule ?? []) {
    for (const part of step.slot.split("|").map((s) => s.trim())) {
      // "activity" has no entry in SLOT_TO_CATEGORY — look up the activity directly
      if (part === "activity" && step.place?.sourceKind === "activity" && step.place.id) {
        const activity = getActivityById(step.place.id);
        if (activity) {
          for (const cat of activity.categories) {
            if (CATEGORY_CONFIG[cat]) weights[cat] = (weights[cat] ?? 0) + 1;
          }
        }
        continue;
      }
      const cat = SLOT_TO_CATEGORY[part];
      if (cat) weights[cat] = (weights[cat] ?? 0) + 1;
    }
  }
  let best: string | null = null;
  let bestW = 0;
  for (const [cat, w] of Object.entries(weights)) {
    if (w > bestW) {
      best = cat;
      bestW = w;
    }
  }
  return best;
}

export default function SwipeIdeas({ navigation }: { navigation: AppNavigation; goToTab?: (key: string) => void }) {
  const { isUnlocked } = usePremium();
  const insets = useSafeAreaInsets();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [canSave, setCanSave] = useState(() => canSaveIdea(isUnlocked));
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [activityModalId, setActivityModalId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Filters>(makeDefaultFilters);
  const [filterVisible, setFilterVisible] = useState(false);
  const [draft, setDraft] = useState<Filters>(makeDefaultFilters);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const swipeCountRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const interstitialReadyRef = useRef(false);

  // Pre-load interstitial ad for free users
  useEffect(() => {
    if (isUnlocked) return;
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);
    interstitialRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialReadyRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialReadyRef.current = false;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialReadyRef.current = false;
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [isUnlocked]);

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-20deg", "0deg", "20deg"],
    extrapolate: "clamp",
  });
  const skipOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH / 3, -20, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: "clamp",
  });
  const saveOpacity = translateX.interpolate({
    inputRange: [0, 20, SCREEN_WIDTH / 3],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  });

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
  // Spread into a new array each generation so useFilledIdeas re-shuffles instead of returning cached ideas
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
    // Do NOT reset currentIndex — user continues from where they are in their current
    // batch of 10 so the swipe counter keeps running and ads trigger as expected.
    setGenerationCount((c) => c + 1);
  }, [draft]);

  const resetDraft = useCallback(() => {
    setDraft(makeDefaultFilters());
    setShowDatePicker(false);
  }, []);

  const toggleDraftCategory = useCallback((cat: string) => {
    setDraft((d) => {
      const has = d.categories.includes(cat);
      if (has && d.categories.length === 1) return d; // require at least one
      return { ...d, categories: has ? d.categories.filter((c) => c !== cat) : [...d.categories, cat] };
    });
  }, []);

  const advanceCard = useCallback(
    (direction: "left" | "right") => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      const toX = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      Animated.parallel([
        Animated.timing(translateX, { toValue: toX, duration: 220, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        swipeCountRef.current += 1;
        translateX.setValue(0);
        setCurrentIndex((p) => p + 1);
        // Wait one frame for React to commit the new card content before revealing it
        requestAnimationFrame(() => {
          cardOpacity.setValue(1);
          isAnimatingRef.current = false;
        });

        if (!isUnlocked && swipeCountRef.current % AD_EVERY_N_SWIPES === 0) {
          if (interstitialReadyRef.current && interstitialRef.current) {
            interstitialRef.current.show();
          }
        }
      });
    },
    [translateX, cardOpacity, isUnlocked],
  );

  const handleSave = useCallback(() => {
    const idea = ideas[currentIndex];
    if (!idea) return;
    if (!canSave) {
      setPaywallVisible(true);
      return;
    }
    saveDateIdea(idea);
    advanceCard("right");
  }, [ideas, currentIndex, canSave, advanceCard]);

  const handleSkip = useCallback(() => {
    if (!ideas[currentIndex]) return;
    advanceCard("left");
  }, [ideas, currentIndex, advanceCard]);

  const onGestureEvent = useCallback(
    (event: any) => {
      if (!isAnimatingRef.current) {
        translateX.setValue(event.nativeEvent.translationX);
      }
    },
    [translateX],
  );

  const onHandlerStateChange = useCallback(
    (event: any) => {
      if (isAnimatingRef.current) return;
      const { state, translationX: tx } = event.nativeEvent;
      if (state === State.END) {
        if (tx > SWIPE_THRESHOLD) {
          handleSave();
        } else if (tx < -SWIPE_THRESHOLD) {
          handleSkip();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      } else if (state === State.FAILED || state === State.CANCELLED) {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
    [translateX, handleSave, handleSkip],
  );

  const currentIdea = ideas[currentIndex];
  const nextIdea = ideas[currentIndex + 1];
  const category = currentIdea ? getIdeaCategory(currentIdea) : null;
  const catConfig = (category && CATEGORY_CONFIG[category]) || DEFAULT_CAT;
  const nextCategory = nextIdea ? getIdeaCategory(nextIdea) : null;
  const nextCatConfig = (nextCategory && CATEGORY_CONFIG[nextCategory]) || DEFAULT_CAT;

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
          <Text style={styles.doneSub}>You've seen all {ideas.length} ideas.</Text>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <BottomBackgroundArt bottomOffset={0} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
            <Ionicons name="options-outline" size={22} color={hasActiveFilters ? "#1e90ff" : "#555"} />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Swipe right to save · left to skip</Text>
      </View>

      <View style={styles.cardArea}>
        {nextIdea && (
          <Animated.View style={[styles.card, styles.cardShadow, { backgroundColor: nextCatConfig.bg }]}>
            <View style={[styles.catPill, { borderColor: nextCatConfig.color }]}>
              <Ionicons name={nextCatConfig.icon as any} size={13} color={nextCatConfig.color} />
              <Text style={[styles.catText, { color: nextCatConfig.color }]}>{nextCatConfig.label}</Text>
            </View>
            <Text style={styles.ideaText}>{nextIdea.filledTemplate}</Text>
            <View style={styles.schedule}>
              {(nextIdea.schedule ?? []).slice(0, 4).map((step, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <View style={[styles.dot, { backgroundColor: nextCatConfig.color + "80" }]} />
                  <Text style={styles.stepTitle} numberOfLines={1}>{step.title}</Text>
                  {step.startTime ? <Text style={styles.stepTime}>{step.startTime}</Text> : null}
                </View>
              ))}
            </View>
            <View style={styles.linkDivider} />
            <IdeaPlaceLinks
              places={Object.values(nextIdea.places ?? {})}
              navigation={navigation}
              marginTop={0}
              onActivityPress={(p) => setActivityModalId(p.id)}
            />
          </Animated.View>
        )}

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-12, 12]}
          failOffsetY={[-30, 30]}
        >
          <Animated.View
            style={[
              styles.card,
              styles.cardShadow,
              { transform: [{ translateX }, { rotate }], opacity: cardOpacity, backgroundColor: catConfig.bg },
            ]}
          >
            <Animated.View style={[styles.badge, styles.badgeSkip, { opacity: skipOpacity }]}>
              <Text style={[styles.badgeText, { color: "#ef4444" }]}>SKIP</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.badgeSave, { opacity: saveOpacity }]}>
              <Text style={[styles.badgeText, { color: "#22c55e" }]}>SAVE</Text>
            </Animated.View>

            <View style={[styles.catPill, { borderColor: catConfig.color }]}>
              <Ionicons name={catConfig.icon as any} size={13} color={catConfig.color} />
              <Text style={[styles.catText, { color: catConfig.color }]}>{catConfig.label}</Text>
            </View>

            <Text style={styles.ideaText}>{currentIdea.filledTemplate}</Text>

            <View style={styles.schedule}>
              {(currentIdea.schedule ?? []).slice(0, 4).map((step, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <View style={[styles.dot, { backgroundColor: catConfig.color + "80" }]} />
                  <Text style={styles.stepTitle} numberOfLines={1}>
                    {step.title}
                  </Text>
                  {step.startTime ? <Text style={styles.stepTime}>{step.startTime}</Text> : null}
                </View>
              ))}
            </View>
            <View style={styles.linkDivider} />
            <IdeaPlaceLinks
              places={Object.values(currentIdea.places ?? {})}
              navigation={navigation}
              marginTop={0}
              onActivityPress={(p) => setActivityModalId(p.id)}
            />
          </Animated.View>
        </PanGestureHandler>
      </View>

      <Text style={styles.counterText}>
        {currentIndex + 1} / {ideas.length}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={handleSkip}>
          <Ionicons name="close" size={32} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnBookmark} onPress={() => navigation.navigate("SavedIdeas")}>
          <Ionicons name="bookmark-outline" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
          <Ionicons name="heart" size={32} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />

      {/* Filter sheet */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.filterSheet}>
            {/* Header */}
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={resetDraft}>
                <Text style={styles.filterReset}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {/* Date */}
              <Text style={styles.filterSectionLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowDatePicker((v) => !v)}
              >
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
                    if (date) {
                      setDraft((d) => ({ ...d, selectedDate: date.toISOString().slice(0, 10) }));
                    }
                  }}
                />
              )}

              {/* Time window */}
              <Text style={styles.filterSectionLabel}>Time Window</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeStepper}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setDraft((d) => ({ ...d, startHour: Math.max(0, d.startHour - 1) }))}
                    >
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{formatHour(draft.startHour)}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setDraft((d) => ({ ...d, startHour: Math.min(d.endHour - 1, d.startHour + 1) }))}
                    >
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Ionicons name="arrow-forward" size={16} color="#bbb" style={{ marginTop: 20 }} />

                <View style={styles.timeStepper}>
                  <Text style={styles.timeLabel}>End</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setDraft((d) => ({ ...d, endHour: Math.max(d.startHour + 1, d.endHour - 1) }))}
                    >
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{formatHour(draft.endHour)}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setDraft((d) => ({ ...d, endHour: Math.min(23, d.endHour + 1) }))}
                    >
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Duration */}
              <Text style={styles.filterSectionLabel}>Duration</Text>
              <View style={styles.chipRow}>
                {DURATION_OPTIONS.map((opt) => {
                  const active = draft.dateLengthMinutes === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((d) => ({ ...d, dateLengthMinutes: opt.value }))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Budget */}
              <Text style={styles.filterSectionLabel}>Budget</Text>
              <View style={styles.chipRow}>
                {BUDGET_OPTIONS.map((opt) => {
                  const active = draft.maxPrice === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDraft((d) => ({ ...d, maxPrice: opt.value }))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Categories */}
              <Text style={styles.filterSectionLabel}>Categories</Text>
              <View style={styles.catGrid}>
                {(DATE_CATEGORIES as readonly string[]).map((cat) => {
                  const active = draft.categories.includes(cat);
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        active && { backgroundColor: cfg.bg, borderColor: cfg.color },
                      ]}
                      onPress={() => toggleDraftCategory(cat)}
                    >
                      <Ionicons name={cfg.icon as any} size={14} color={active ? cfg.color : "#999"} />
                      <Text style={[styles.catChipText, active && { color: cfg.color }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Apply */}
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Activity detail sheet */}
      <Modal
        visible={activityModalId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivityModalId(null)}
      >
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
                      <Text style={styles.modalStatValue}>
                        {activity.durationMinutes.min}–{activity.durationMinutes.max} min
                      </Text>
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
  doneSub: { fontSize: 15, color: "#6b7280", marginTop: 8, textAlign: "center" },
  restartBtn: {
    marginTop: 28,
    backgroundColor: "#1e90ff",
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  restartBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  savedLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
  savedLinkText: { color: "#e63f67", fontSize: 15, fontWeight: "500" },
  header: { paddingHorizontal: 24, paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#1a1a1a" },
  filterBtn: { position: "absolute", right: 0, padding: 4 },
  filterDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#1e90ff",
  },
  headerSub: { fontSize: 13, color: "#8e8e93", marginTop: 2, textAlign: "center" },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    borderRadius: 22,
    padding: 24,
  },
  backCard: {
    transform: [{ scale: 0.95 }],
  },
  linkDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 14,
    marginBottom: 4,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: 24,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 3,
  },
  badgeSkip: { right: 20, borderColor: "#ef4444", transform: [{ rotate: "12deg" }] },
  badgeSave: { left: 20, borderColor: "#22c55e", transform: [{ rotate: "-12deg" }] },
  badgeText: { fontSize: 20, fontWeight: "900", letterSpacing: 2 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.7)",
    marginBottom: 16,
    marginTop: 8,
  },
  catText: { fontSize: 12, fontWeight: "600" },
  ideaText: { fontSize: 19, fontWeight: "700", color: "#1a1a1a", lineHeight: 27, marginBottom: 20 },
  schedule: { gap: 10 },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  stepTitle: { flex: 1, fontSize: 14, color: "#374151" },
  stepTime: { fontSize: 12, color: "#9ca3af" },
  counterText: { textAlign: "center", fontSize: 13, color: "#aaa", paddingVertical: 4 },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  btnSkip: { backgroundColor: "#fff1f1" },
  btnSave: { backgroundColor: "#f0fdf4" },
  btnBookmark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  // Shared modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  // Filter sheet
  filterSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: "88%",
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
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
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  timeStepper: { flex: 1, alignItems: "center" },
  timeLabel: { fontSize: 13, color: "#888", marginBottom: 6 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", minWidth: 52, textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
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
  applyBtn: {
    marginTop: 24,
    backgroundColor: "#1e90ff",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
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
  modalTitle: {
    fontSize: 24,
    color: "#1a1a1a",
    marginBottom: 10,
    fontFamily: "SuperPandora",
  },
  modalDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 18,
  },
  modalStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  modalStatBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  modalStatLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  modalStatValue: { fontSize: 16, color: "#1a1a1a", fontWeight: "600" },
  modalTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalTag: {
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  modalTagText: { fontSize: 13, color: "#6d28d9" },
});
