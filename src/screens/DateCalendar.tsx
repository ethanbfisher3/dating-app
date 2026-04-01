import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRecordedDates, subscribeRecordedDates, type RecordedDate } from "../data/dateHistoryStore";
import { getSavedIdeas, subscribeSavedIdeas, type SavedDateIdea } from "../data/savedIdeasStore";
import { AppNavigation } from "src/types/navigation";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function DateCalendar({ navigation }: { navigation: AppNavigation }) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [recordedDateKeys, setRecordedDateKeys] = useState<string[]>([]);
  const [savedIdeaDateKeys, setSavedIdeaDateKeys] = useState<string[]>([]);
  const [recordedDates, setRecordedDates] = useState<RecordedDate[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
      title: "Date Calendar",
    });
  }, [navigation]);

  useEffect(() => {
    const load = () => {
      const recorded = getRecordedDates().filter((entry) => isValidDateKey(entry.dateOfDate));
      const saved = getSavedIdeas().filter((entry) => entry.selectedDate && isValidDateKey(entry.selectedDate));

      setRecordedDates(recorded);
      setSavedIdeas(saved);
      setRecordedDateKeys(recorded.map((entry) => entry.dateOfDate));
      setSavedIdeaDateKeys(saved.map((entry) => entry.selectedDate as string));
    };

    load();
    const unsubRecorded = subscribeRecordedDates(load);
    const unsubSavedIdeas = subscribeSavedIdeas(load);

    return () => {
      unsubRecorded();
      unsubSavedIdeas();
    };
  }, []);

  const todayKey = toDateKey(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, { past: number; future: number }>();

    const increment = (dateKey: string, isFuture: boolean) => {
      const current = map.get(dateKey) ?? { past: 0, future: 0 };
      if (isFuture) {
        current.future += 1;
      } else {
        current.past += 1;
      }
      map.set(dateKey, current);
    };

    recordedDateKeys.forEach((dateKey) => {
      increment(dateKey, dateKey >= todayKey);
    });

    savedIdeaDateKeys.forEach((dateKey) => {
      increment(dateKey, dateKey >= todayKey);
    });

    return map;
  }, [savedIdeaDateKeys, recordedDateKeys, todayKey]);

  const monthStart = startOfMonth(currentMonth);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const goToPreviousMonth = () => {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const totalPast = Array.from(eventsByDate.values()).reduce((sum, entry) => sum + entry.past, 0);
  const totalFuture = Array.from(eventsByDate.values()).reduce((sum, entry) => sum + entry.future, 0);

  const selectedRecordedDates = useMemo(() => {
    if (!selectedDateKey) return [];
    return recordedDates.filter((entry) => entry.dateOfDate === selectedDateKey);
  }, [recordedDates, selectedDateKey]);

  const selectedSavedIdeas = useMemo(() => {
    if (!selectedDateKey) return [];
    return savedIdeas.filter((entry) => entry.selectedDate === selectedDateKey);
  }, [savedIdeas, selectedDateKey]);

  const openDateDetails = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setIsDetailsModalVisible(true);
  };

  const closeDateDetails = () => {
    setIsDetailsModalVisible(false);
    setSelectedDateKey(null);
  };

  const selectedDateLabel = selectedDateKey
    ? new Date(`${selectedDateKey}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 48,
        backgroundColor: "#fafbfc",
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 34,
          marginBottom: 12,
          color: "#1a1a1a",
        }}
      >
        Date Calendar
      </Text>

      {/* <Text
        style={{
          marginBottom: 16,
          fontSize: 16,
          lineHeight: 24,
          color: "#555",
        }}
      >
        Track dates you've been on and your planned future dates.
      </Text> */}

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#dce6ef",
          padding: 14,
          marginBottom: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={{
              backgroundColor: "#eff6ff",
              borderColor: "#bfdbfe",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#1d4ed8", fontWeight: "700" }}>Prev</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: "800", color: "#1f2d3d" }}>{monthLabel(currentMonth)}</Text>

          <TouchableOpacity
            onPress={goToNextMonth}
            style={{
              backgroundColor: "#eff6ff",
              borderColor: "#bfdbfe",
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#1d4ed8", fontWeight: "700" }}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <View key={day} style={{ width: "14.285%", alignItems: "center" }}>
              <Text style={{ color: "#6b7280", fontWeight: "700", fontSize: 12 }}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((dayNumber, index) => {
            if (dayNumber === null) {
              return <View key={`empty_${index}`} style={{ width: "14.285%", padding: 4 }} />;
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
            const stats = eventsByDate.get(dateKey);
            const hasPast = Boolean(stats?.past);
            const hasFuture = Boolean(stats?.future);
            const isToday = dateKey === todayKey;
            const hasEntries = hasPast || hasFuture;

            return (
              <View key={dateKey} style={{ width: "14.285%", padding: 4 }}>
                <TouchableOpacity
                  onPress={() => openDateDetails(dateKey)}
                  disabled={!hasEntries}
                  activeOpacity={0.75}
                  style={{
                    minHeight: 54,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isToday ? "#1e90ff" : "#dce6ef",
                    backgroundColor: isToday ? "#eff6ff" : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: hasEntries ? 1 : 0.72,
                  }}
                >
                  <Text style={{ color: "#1f2d3d", fontWeight: "700" }}>{dayNumber}</Text>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 4 }}>
                    {hasPast ? (
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: "#ef4444",
                        }}
                      />
                    ) : null}
                    {hasFuture ? (
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: "#22c55e",
                        }}
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#dce6ef",
          padding: 14,
          marginBottom: 14,
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
          Legend
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#ef4444",
              marginRight: 8,
            }}
          />
          <Text style={{ color: "#4b5b6b" }}>Past dates</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#22c55e",
              marginRight: 8,
            }}
          />
          <Text style={{ color: "#4b5b6b" }}>Future dates</Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#dce6ef",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Text
          style={{
            color: "#1f2d3d",
            fontSize: 15,
            fontWeight: "800",
            marginBottom: 4,
          }}
        >
          Summary
        </Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 2 }}>Past entries: {totalPast}</Text>
        <Text style={{ color: "#4b5b6b" }}>Future entries: {totalFuture}</Text>
      </View>

      <Modal visible={isDetailsModalVisible} transparent animationType="fade" onRequestClose={closeDateDetails}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#dce6ef",
              maxHeight: "85%",
              overflow: "hidden",
            }}
          >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: "#1f2d3d",
                    flex: 1,
                    marginRight: 10,
                  }}
                >
                  {selectedDateLabel}
                </Text>
                <TouchableOpacity onPress={closeDateDetails}>
                  <Text
                    style={{
                      color: "#1e90ff",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedRecordedDates.length > 0 ? (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#ef4444",
                      marginBottom: 8,
                    }}
                  >
                    Recorded Dates
                  </Text>
                  {selectedRecordedDates.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={{
                        borderWidth: 1,
                        borderColor: "#e8edf3",
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: "#1f2d3d",
                          marginBottom: 3,
                        }}
                      >
                        Date #{index + 1}
                      </Text>
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
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#22c55e",
                      marginBottom: 8,
                    }}
                  >
                    Saved Date Ideas
                  </Text>
                  {selectedSavedIdeas.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={{
                        borderWidth: 1,
                        borderColor: "#e8edf3",
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: "#1f2d3d",
                          marginBottom: 3,
                        }}
                      >
                        Saved Idea #{index + 1}
                      </Text>
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
    </ScrollView>
  );
}
