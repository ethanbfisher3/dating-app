import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import Text from "../Components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getRecordedDates, initializeRecordedDates, subscribeRecordedDates, type RecordedDate } from "../data/dateHistoryStore";
import { getSavedIdeas, subscribeSavedIdeas, type SavedDateIdea } from "../data/savedIdeasStore";
import { AppNavigation } from "src/types/navigation";
import { Ionicons } from "@expo/vector-icons";
import PageInfoModal from "../Components/PageInfoModal";
import CalendarWidget from "../Components/CalendarWidget";

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateLong(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DateCalendar({ navigation }: { navigation?: AppNavigation }) {
  const insets = useSafeAreaInsets();
  const [recordedDates, setRecordedDates] = useState<RecordedDate[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  if (navigation) {
    useLayoutEffect(() => {
      navigation.setOptions({
        headerBackTitle: "Back",
        title: "Date Calendar",
      });
    }, [navigation]);
  }

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      if (!isMounted) return;
      const recorded = getRecordedDates().filter((e) => isValidDateKey(e.dateOfDate));
      const saved = getSavedIdeas().filter((e) => e.selectedDate && isValidDateKey(e.selectedDate));
      setRecordedDates(recorded);
      setSavedIdeas(saved);
    };
    void initializeRecordedDates().then(load);
    const unsubRecorded = subscribeRecordedDates(load);
    const unsubSaved = subscribeSavedIdeas(load);
    return () => {
      isMounted = false;
      unsubRecorded();
      unsubSaved();
    };
  }, []);

  const selectedRecordedDates = useMemo(() => {
    if (!selectedDateKey) return [];
    return recordedDates.filter((e) => e.dateOfDate === selectedDateKey);
  }, [recordedDates, selectedDateKey]);

  const selectedSavedIdeas = useMemo(() => {
    if (!selectedDateKey) return [];
    return savedIdeas.filter((e) => e.selectedDate === selectedDateKey);
  }, [savedIdeas, selectedDateKey]);

  const handleDayPress = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setIsDetailsModalVisible(true);
  };

  const closeDateDetails = () => {
    setIsDetailsModalVisible(false);
    setSelectedDateKey(null);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 48,
        backgroundColor: "transparent",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <Text style={{ fontSize: 34, color: "#1a1a1a", flex: 1, fontFamily: "SuperPandora" }}>
          Date Calendar
        </Text>
        <TouchableOpacity
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#eef5ff", alignItems: "center", justifyContent: "center", marginTop: 4 }}
          onPress={() => setInfoVisible(true)}
        >
          <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
        See all your planned and recorded dates in one place.
      </Text>

      <CalendarWidget onDayPress={handleDayPress} />

      {/* Day detail modal */}
      <Modal visible={isDetailsModalVisible} transparent animationType="fade" onRequestClose={closeDateDetails}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", maxHeight: "85%", overflow: "hidden" }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 20, color: "#1f2d3d", flex: 1, marginRight: 10 }}>
                  {selectedDateKey ? formatDateLong(selectedDateKey) : ""}
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

      <PageInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description="This calendar combines your recorded dates and planned or saved ideas in one monthly view."
        bullets={[
          "Tap any day with colored dots to see full details.",
          "Red dots are recorded past dates.",
          "Green dots are saved or planned future ideas.",
        ]}
      />
    </ScrollView>
  );
}
