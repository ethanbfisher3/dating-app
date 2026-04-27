import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import type { AppNavigation } from "../types/navigation";
import { DATE_CATEGORIES, timesAreInvalid } from "../utils/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import { addPlannedDate } from "../data/plannedDatesStore";
import PaywallModal from "../Components/PaywallModal";
import PlanDateInputsModal from "../Components/PlanDateInputsModal";
import usePurchases from "src/hooks/usePurchases";
import PageInfoModal from "../Components/PageInfoModal";

export default function PlanADate({ navigation }: { navigation: AppNavigation }) {
  const { isUnlocked } = usePremium();
  const { lifetimePremium } = usePurchases();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);
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
    setMaxDistance((prev) => {
      if (isUnlocked) return prev === "5" ? "10" : prev;
      return Number.parseInt(prev, 10) > 5 ? "5" : prev;
    });
  }, [isUnlocked]);
  const selectedCategoriesCount = useMemo(() => categoriesChecked.filter(Boolean).length, [categoriesChecked]);

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
    if (!isUnlocked && finalMaxDistance > 5) {
      finalMaxDistance = 5;
      Alert.alert("Distance Limited", "Premium users can search up to 25+ miles. Free tier is limited to 5 miles.");
    }

    if (!actualUserLocation) {
      Alert.alert("Location Not Ready", "Your current location is not available yet. No places will be shown until it is loaded.");
      return;
    }

    setIsGeneratingIdeas(true);
    addPlannedDate(selectedDateIso);
    setShowDatePicker(false);
    setIsModalVisible(false);

    navigation.navigate("PlannedDateResults", {
      maxPrice: parsedPrice,
      selectedDate: selectedDateIso,
      startHour: start24,
      endHour: end24,
      dateLengthMinutes: parsedDateLengthMinutes,
      maxDistance: finalMaxDistance,
      categories: selectedCategories,
      serverTarget,
      userLocation: actualUserLocation,
    });

    setTimeout(() => setIsGeneratingIdeas(false), 500);
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
          backgroundColor: "#fafbfc",
          flexGrow: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginVertical: 24,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              fontSize: 36,
              color: "#1a1a1a",
              flex: 1,
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

        <Image
          source={require("../assets/images/guy_asking_girl.jpg")}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            marginBottom: 24,
          }}
          resizeMode="cover"
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsModalVisible(true)}
          style={{
            backgroundColor: "#1e90ff",
            borderRadius: 12,
            paddingVertical: 18,
            paddingHorizontal: 18,
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Generate Date Ideas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate("DateCalendar")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#1e90ff",
            paddingVertical: 16,
            paddingHorizontal: 18,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#1e90ff", fontSize: 17, fontWeight: "800" }}>View Date Calendar</Text>
        </TouchableOpacity>

        {lifetimePremium ? (
          !isUnlocked ? (
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
                    fontWeight: "800",
                    color: "#007AFF",
                    marginBottom: 2,
                  }}
                >
                  Unlock Premium
                </Text>
                <Text style={{ fontSize: 13, color: "#0051D5", fontWeight: "500" }}>
                  Save unlimited ideas for only {lifetimePremium.priceString}
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
                    fontWeight: "800",
                    color: "#2e9f5b",
                    marginBottom: 2,
                  }}
                >
                  You are a premium user
                </Text>
                <Text style={{ fontSize: 13, color: "#1f7a45", fontWeight: "500" }}>You can save unlimited date ideas.</Text>
              </View>
            </View>
          )
        ) : null}

        <PlanDateInputsModal
          visible={isModalVisible}
          showDatePicker={showDatePicker}
          selectedDate={selectedDate}
          maxPrice={maxPrice}
          startHour12={startHour12}
          startPeriod={startPeriod}
          endHour12={endHour12}
          endPeriod={endPeriod}
          dateLengthHours={dateLengthHours}
          dateLengthMinutes={dateLengthMinutes}
          maxDistance={maxDistance}
          categoriesChecked={categoriesChecked}
          selectedCategoriesCount={selectedCategoriesCount}
          isGeneratingIdeas={isGeneratingIdeas}
          serverTarget={serverTarget}
          onClose={() => {
            setShowDatePicker(false);
            setIsModalVisible(false);
          }}
          onShowDatePicker={() => setShowDatePicker(true)}
          onHideDatePicker={() => setShowDatePicker(false)}
          onDateChange={(value) => setSelectedDate(value)}
          onChangeMaxPrice={setMaxPrice}
          onChangeStartHour12={(text) => {
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
          onChangeEndHour12={(text) => {
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
          onSetStartPeriod={setStartPeriod}
          onSetEndPeriod={setEndPeriod}
          onChangeDateLengthHours={(text) => setDateLengthHours(sanitizeHourOrMinute(text, 23))}
          onChangeDateLengthMinutes={(text) => setDateLengthMinutes(sanitizeHourOrMinute(text, 59))}
          onChangeMaxDistance={setMaxDistance}
          onToggleCategory={toggleCategory}
          onSubmit={handleGenerateIdeas}
        />

        <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />
      </ScrollView>
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
