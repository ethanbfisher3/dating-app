import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  addRecordedDate,
  FREE_TIER_RECORDED_DATES_LIMIT,
  getRecordedDates,
  initializeRecordedDates,
  removeRecordedDate,
  subscribeRecordedDates,
  updateRecordedDate,
  type RecordedDate,
} from "../data/dateHistoryStore";
import type { AppNavigation } from "../types/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "../Components/PaywallModal";
import PageInfoModal from "../Components/PageInfoModal";
import Text from "../Components/AppText";

function getRatingColor(n: number): string {
  const hue = Math.round(((n - 1) / 9) * 120);
  return `hsl(${hue}, 72%, 40%)`;
}

function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color = "#007AFF" }: { icon: string; value: string; label: string; color?: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

// ── Date card ────────────────────────────────────────────────────────────────

function DateCard({ date, onPress }: { date: RecordedDate; onPress: () => void }) {
  const hasImage = !!date.imageUri;
  const hasRating = date.rating != null;

  return (
    <TouchableOpacity onPress={onPress} style={styles.dateCard} activeOpacity={0.72}>
      <View style={styles.dateCardLeft}>
        {hasImage ? (
          <Image source={{ uri: date.imageUri! }} style={styles.dateCardThumbnail} />
        ) : hasRating ? (
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(date.rating!) }]}>
            <Text style={styles.ratingBadgeText}>{date.rating}</Text>
          </View>
        ) : (
          <View style={[styles.ratingBadge, { backgroundColor: "#f0f0f8" }]}>
            <Ionicons name="heart" size={22} color="#c0c0d8" />
          </View>
        )}
      </View>

      <View style={styles.dateCardRight}>
        <View style={styles.dateCardTopRow}>
          <Text style={styles.dateCardName} numberOfLines={1}>
            {date.whoWentWith}
          </Text>
          <Text style={styles.dateCardDateText}>{formatDateShort(date.dateOfDate)}</Text>
        </View>
        <Text style={styles.dateCardActivity} numberOfLines={2}>
          {date.whatYouDid}
        </Text>
        {date.moneySpent !== -1 ? <Text style={styles.dateCardMoney}>${date.moneySpent.toFixed(2)}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function DateHistoryScreen(_: { navigation: AppNavigation }) {
  const [recordedDates, setRecordedDates] = useState<RecordedDate[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [detailDate, setDetailDate] = useState<RecordedDate | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const { isUnlocked } = usePremium();

  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [whoWentWith, setWhoWentWith] = useState("");
  const [whatYouDid, setWhatYouDid] = useState("");
  const [dateImageUri, setDateImageUri] = useState<string | null>(null);
  const [moneySpent, setMoneySpent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [whatYouLiked, setWhatYouLiked] = useState("");
  const [whatYouLearned, setWhatYouLearned] = useState("");
  const modalScrollRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();
  const maxSelectableDate = getTodayEnd();

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      if (isMounted) setRecordedDates(getRecordedDates());
    };
    void initializeRecordedDates().then(load);
    const unsubscribe = subscribeRecordedDates(load);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Stats derived from recorded dates
  const stats = useMemo(() => {
    if (!recordedDates.length) return null;

    const total = recordedDates.length;
    const rated = recordedDates.filter((d) => d.rating != null);
    const avgRating = rated.length ? rated.reduce((s, d) => s + (d.rating ?? 0), 0) / rated.length : null;

    const personCounts = new Map<string, number>();
    for (const d of recordedDates) {
      const name = d.whoWentWith.trim();
      if (name) personCounts.set(name, (personCounts.get(name) ?? 0) + 1);
    }
    let topPerson: string | null = null;
    let topPersonCount = 0;
    for (const [name, count] of personCounts) {
      if (count > topPersonCount) {
        topPerson = name;
        topPersonCount = count;
      }
    }

    const highestRated = rated.length ? [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] : null;

    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const datesWithSpending = recordedDates.filter((d) => d.moneySpent !== -1);
    const spentThisMonth = datesWithSpending.filter((d) => d.dateOfDate.startsWith(thisMonthKey)).reduce((s, d) => s + d.moneySpent, 0);
    const spentAllTime = datesWithSpending.reduce((s, d) => s + d.moneySpent, 0);
    const hasSpending = datesWithSpending.length > 0;

    return { total, avgRating, topPerson, topPersonCount, highestRated, spentThisMonth, spentAllTime, hasSpending };
  }, [recordedDates]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    const isConfirmed = Platform.OS === "ios" || event.type === "set";
    if (isConfirmed && date) setSelectedDate(date > maxSelectableDate ? maxSelectableDate : date);
  };

  const resetForm = () => {
    setWhoWentWith("");
    setWhatYouDid("");
    setDateImageUri(null);
    setMoneySpent("");
    setRating(null);
    setWhatYouLiked("");
    setWhatYouLearned("");
    setSelectedDate(new Date());
    setShowDatePicker(false);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingDateId(null);
    resetForm();
  };

  const openCreateModal = () => {
    if (!isUnlocked && recordedDates.length >= FREE_TIER_RECORDED_DATES_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    setEditingDateId(null);
    resetForm();
    setFormVisible(true);
  };

  const openEditModal = (date: RecordedDate) => {
    setEditingDateId(date.id);
    setSelectedDate(new Date(date.dateOfDate));
    setDateImageUri(date.imageUri ?? null);
    setWhoWentWith(date.whoWentWith);
    setWhatYouDid(date.whatYouDid);
    setMoneySpent(date.moneySpent === -1 ? "" : String(date.moneySpent));
    setRating(date.rating);
    setWhatYouLiked(date.whatYouLiked);
    setWhatYouLearned(date.whatYouLearned);
    setShowDatePicker(false);
    setFormVisible(true);
  };

  const addExampleDate = () => {
    addRecordedDate({
      dateOfDate: new Date().toISOString(),
      imageUri: null,
      whoWentWith: "Alex",
      whatYouDid: "Went to a cozy cafe and had a great conversation.",
      moneySpent: 45.0,
      rating: 9,
      whatYouLiked: "I really enjoyed the deep conversation and the vibe of the cafe.",
      whatYouLearned: "I learned that Alex is really passionate about travel and has some amazing stories.",
    });
    closeForm();
  };

  const handleSaveDate = () => {
    if (selectedDate > maxSelectableDate) {
      Alert.alert("Error", "Date must be today or earlier");
      return;
    }
    if (!whoWentWith.trim()) {
      Alert.alert("Error", "Please enter who you went out with");
      return;
    }
    if (!whatYouDid.trim()) {
      Alert.alert("Error", "Please describe what you did on the date");
      return;
    }

    const moneyValue = parseFloat(moneySpent);
    if (moneyValue < 0 && moneySpent.trim() !== "") {
      Alert.alert("Error", "Money spent cannot be negative");
      return;
    }
    if (!isUnlocked && !editingDateId && recordedDates.length >= FREE_TIER_RECORDED_DATES_LIMIT) {
      setPaywallVisible(true);
      return;
    }

    const datePayload = {
      dateOfDate: selectedDate.toISOString().split("T")[0],
      imageUri: dateImageUri,
      whoWentWith: whoWentWith.trim(),
      whatYouDid: whatYouDid.trim(),
      moneySpent: Number.isNaN(moneyValue) ? -1 : moneyValue,
      rating,
      whatYouLiked: whatYouLiked.trim(),
      whatYouLearned: whatYouLearned.trim(),
    };

    if (editingDateId) {
      updateRecordedDate(editingDateId, datePayload);
    } else {
      addRecordedDate(datePayload);
    }

    closeForm();
  };

  const handlePickDateImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo Access Needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets.length > 0) setDateImageUri(result.assets[0].uri);
  };

  const handleDeleteDate = (id: string, onDeleted?: () => void) => {
    Alert.alert("Delete Date", "Are you sure you want to delete this date record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          removeRecordedDate(id);
          onDeleted?.();
        },
        style: "destructive",
      },
    ]);
  };

  const handleFormInputFocus = (event: any) => {
    const target = event?.target;
    if (!target) return;
    setTimeout(() => {
      (modalScrollRef.current as any)?.scrollResponderScrollNativeHandleToKeyboard?.(target, 120, true);
    }, 120);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[{ padding: 24, paddingBottom: 32 }, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleTextRow}>
            <Text style={styles.title}>Date History</Text>
            {!isUnlocked && (
              <Text style={styles.freeCounterText}>
                {recordedDates.length} out of {FREE_TIER_RECORDED_DATES_LIMIT} used
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={() => setInfoVisible(true)}>
            <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 12, marginTop: 2 }}>Log and reflect on dates you've been on.</Text>

        {/* Stats carousel */}
        {stats ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20, marginTop: 10 }}
            contentContainerStyle={{ gap: 10 }}
          >
            <StatCard icon="calendar" value={String(stats.total)} label="Total Dates" color="#007AFF" />
            {stats.avgRating != null ? (
              <StatCard icon="star" value={stats.avgRating.toFixed(1)} label="Avg Rating" color="#f59e0b" />
            ) : null}
            {stats.topPerson ? (
              <StatCard
                icon="person"
                value={stats.topPerson}
                label={`Most Dated${stats.topPersonCount > 1 ? ` (${stats.topPersonCount}×)` : ""}`}
                color="#7c3aed"
              />
            ) : null}
            {stats.highestRated ? (
              <StatCard
                icon="trophy"
                value={`${stats.highestRated.rating}/10`}
                label={stats.highestRated.whoWentWith}
                color={getRatingColor(stats.highestRated.rating!)}
              />
            ) : null}
            {stats.hasSpending ? (
              <StatCard icon="cash-outline" value={`$${stats.spentThisMonth.toFixed(0)}`} label="Spent This Month" color="#059669" />
            ) : null}
            {stats.hasSpending ? (
              <StatCard icon="wallet-outline" value={`$${stats.spentAllTime.toFixed(0)}`} label="All-Time Spent" color="#7c3aed" />
            ) : null}
          </ScrollView>
        ) : null}

        {/* Record button */}
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>{recordedDates.length ? "Record Date" : "Record Your First Date"}</Text>
        </TouchableOpacity>

        {/* Empty state */}
        {recordedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={56} color="#ccc" style={{ marginBottom: 20 }} />
            <Text style={styles.emptyTitle}>No Dates Recorded Yet</Text>
            <Text style={styles.emptyDescription}>
              Keep track of dates you've been on — what you did, how much you spent, and what you learned.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {recordedDates.map((date) => (
              <DateCard key={date.id} date={date} onPress={() => setDetailDate(date)} />
            ))}
          </View>
        )}

        {__DEV__ && (
          <TouchableOpacity style={[styles.addButton, { marginTop: 16, backgroundColor: "green" }]} onPress={addExampleDate}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.addButtonText}>(DEV) Add Example</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      {detailDate ? (
        <Modal visible animationType="slide" transparent onRequestClose={() => setDetailDate(null)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{detailDate.whoWentWith}</Text>
                <TouchableOpacity onPress={() => setDetailDate(null)}>
                  <Ionicons name="close" size={28} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                {detailDate.imageUri ? <Image source={{ uri: detailDate.imageUri }} style={styles.detailImage} /> : null}

                <View style={styles.detailTopRow}>
                  {detailDate.rating != null ? (
                    <View style={[styles.ratingBadgeLarge, { backgroundColor: getRatingColor(detailDate.rating) }]}>
                      <Text style={styles.ratingBadgeLargeNum}>{detailDate.rating}</Text>
                      <Text style={styles.ratingBadgeLargeDenom}>/10</Text>
                    </View>
                  ) : null}
                  <Text style={styles.detailDateLabel}>{formatDateLong(detailDate.dateOfDate)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>What You Did</Text>
                  <Text style={styles.detailText}>{detailDate.whatYouDid}</Text>
                </View>

                {detailDate.moneySpent !== -1 ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Money Spent</Text>
                    <Text style={styles.detailText}>${detailDate.moneySpent.toFixed(2)}</Text>
                  </View>
                ) : null}

                {detailDate.whatYouLiked ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>What You Liked</Text>
                    <Text style={styles.detailText}>{detailDate.whatYouLiked}</Text>
                  </View>
                ) : null}

                {detailDate.whatYouLearned ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>What You Learned</Text>
                    <Text style={styles.detailText}>{detailDate.whatYouLearned}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 0.6, borderColor: "#fecdd3" }]}
                  onPress={() => handleDeleteDate(detailDate.id, () => setDetailDate(null))}
                >
                  <Text style={[styles.cancelButtonText, { color: "#be123c" }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    const d = detailDate;
                    setDetailDate(null);
                    openEditModal(d);
                  }}
                >
                  <Text style={styles.saveButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* ── Create / edit form modal ─────────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={formVisible} onRequestClose={closeForm}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingDateId ? "Edit Date" : "Record a Date"}</Text>
              <TouchableOpacity onPress={closeForm}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={modalScrollRef}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>When was the date? *</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>{formatDateShort(selectedDate.toISOString())}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    onChange={handleDateChange}
                    maximumDate={maxSelectableDate}
                    style={styles.datePicker}
                    themeVariant={Platform.OS === "ios" ? "light" : undefined}
                    {...(Platform.OS === "ios" ? { textColor: "#1a1a1a", accentColor: "#007AFF" } : {})}
                  />
                  {Platform.OS === "ios" ? (
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={{ alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#dfe5eb" }}
                    >
                      <Text style={{ color: "#007AFF", fontSize: 16 }}>Done</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Who did you go out with? *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Name(s)"
                  placeholderTextColor="#999"
                  value={whoWentWith}
                  onChangeText={setWhoWentWith}
                  onFocus={handleFormInputFocus}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What did you do? *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the date activity"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={whatYouDid}
                  onChangeText={setWhatYouDid}
                  onFocus={handleFormInputFocus}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Date Photo (optional)</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickDateImage}>
                  <Ionicons name="image-outline" size={18} color="#007AFF" />
                  <Text style={styles.imagePickerButtonText}>{dateImageUri ? "Change Photo" : "Add Photo"}</Text>
                </TouchableOpacity>
                {dateImageUri ? (
                  <View>
                    <Image source={{ uri: dateImageUri }} style={styles.formImagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setDateImageUri(null)}>
                      <Text style={styles.removeImageButtonText}>Remove Photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>How much did you spend?</Text>
                <View style={styles.inputWithPrefix}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.moneyInput}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    value={moneySpent}
                    onChangeText={setMoneySpent}
                    onFocus={handleFormInputFocus}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Rate the date (1–10)</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const color = getRatingColor(n);
                    const selected = rating === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[styles.ratingButton, { borderColor: color }, selected && { backgroundColor: color }]}
                        onPress={() => setRating(selected ? null : n)}
                      >
                        <Text style={[styles.ratingButtonText, { color: selected ? "#fff" : color }]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What did you like about it?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Share what you enjoyed"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  value={whatYouLiked}
                  onChangeText={setWhatYouLiked}
                  onFocus={handleFormInputFocus}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What did you learn?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Share what you learned"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  value={whatYouLearned}
                  onChangeText={setWhatYouLearned}
                  onFocus={handleFormInputFocus}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveDate}>
                <Text style={styles.saveButtonText}>{editingDateId ? "Update Date" : "Save Date"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="date_history_limit" />
      <PageInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description="Record your past dates so you can look back on what happened and what worked."
        bullets={[
          "Tap Record Date to add a new entry.",
          "Tap any date card to see full details or edit it.",
          "Date entries are saved on your device.",
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },

  // Header
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  titleTextRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, flexWrap: "wrap", flex: 1 },
  title: { fontSize: 36, marginTop: 24, marginBottom: 4, color: "#1a1a1a", fontFamily: "SuperPandora" },
  freeCounterText: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef5ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },

  // Stats carousel
  statCard: {
    width: 110,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderTopWidth: 3,
    padding: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: { fontSize: 18, color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#8899aa" },

  // Add button
  addButton: {
    // marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 13,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16 },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 16, paddingBottom: 40 },
  emptyTitle: { fontSize: 20, color: "#1a1a1a", marginBottom: 10 },
  emptyDescription: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },

  // Date card
  dateCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  dateCardLeft: { justifyContent: "center" },
  dateCardThumbnail: { width: 56, height: 56, borderRadius: 10 },
  ratingBadge: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ratingBadgeText: { fontSize: 22, color: "#fff" },
  dateCardRight: { flex: 1, justifyContent: "center", gap: 3 },
  dateCardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  dateCardName: { fontSize: 16, color: "#1a1a1a", flex: 1 },
  dateCardDateText: { fontSize: 12, color: "#8899aa", flexShrink: 0 },
  dateCardActivity: { fontSize: 13, color: "#4a5568", lineHeight: 18 },
  dateCardMoney: { fontSize: 12, color: "#059669" },

  // Detail modal top row
  detailTopRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  ratingBadgeLarge: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  ratingBadgeLargeNum: { fontSize: 28, color: "#fff" },
  ratingBadgeLargeDenom: { fontSize: 14, color: "rgba(255,255,255,0.75)", alignSelf: "flex-end", marginBottom: 4 },
  detailDateLabel: { flex: 1, fontSize: 15, color: "#4a5568", lineHeight: 22 },
  detailImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 11, color: "#8899aa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  detailText: { fontSize: 15, color: "#1a1a1a", lineHeight: 22 },

  // Modal shared
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    maxHeight: "90%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 20, color: "#1a1a1a" },
  modalScroll: { flex: 1 },
  modalScrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 24, flexGrow: 1 },
  modalFooter: { flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingTop: 12 },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  cancelButtonText: { fontSize: 16, color: "#666" },
  saveButton: { flex: 1, backgroundColor: "#007AFF", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  saveButtonText: { fontSize: 16, color: "#fff" },

  // Form
  formSection: { marginBottom: 20 },
  formLabel: { fontSize: 14, color: "#1a1a1a", marginBottom: 8 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: "#fafbfc",
  },
  dateButtonText: { fontSize: 14, color: "#1a1a1a" },
  datePickerContainer: {
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe5eb",
    backgroundColor: "#f3f6fa",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  datePicker: { backgroundColor: "#f3f6fa" },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#fafbfc",
    fontFamily: "System",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "#f0f7ff",
    gap: 8,
  },
  imagePickerButtonText: { fontSize: 14, color: "#007AFF" },
  formImagePreview: { width: "100%", height: 170, borderRadius: 10, marginTop: 10 },
  removeImageButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  removeImageButtonText: { color: "#be123c", fontSize: 12 },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafbfc",
  },
  currencyPrefix: { fontSize: 16, color: "#1a1a1a", paddingHorizontal: 12 },
  moneyInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 0, fontSize: 14, color: "#1a1a1a", fontFamily: "System" },
  ratingRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafbfc",
  },
  ratingButtonText: { fontSize: 14, color: "#1a1a1a" },
});
