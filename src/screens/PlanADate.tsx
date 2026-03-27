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

const ADDRESS_OFF_DEFAULT_LOCATION = {
  latitude: 36.071281486295156,
  longitude: -78.52239044679854,
};

export default function PlanADate({ navigation }: { navigation: AppNavigation }) {
  const { isUnlocked } = usePremium();
  const insets = useSafeAreaInsets();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>("20");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startHour12, setStartHour12] = useState<string>("6");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("PM");
  const [endHour12, setEndHour12] = useState<string>("9");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM");
  const [maxDistance, setMaxDistance] = useState<string>(isUnlocked ? "10" : "5");
  const [actualUserLocation, setActualUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [useMyAddressEnabled, setUseMyAddressEnabled] = useState(true);
  const [categoriesChecked, setCategoriesChecked] = useState(Array(DATE_CATEGORIES.length).fill(true));
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

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
    const selectedDateIso = selectedDate.toISOString().slice(0, 10);

    let finalMaxDistance = parsedDistance;
    if (!isUnlocked && finalMaxDistance > 5) {
      finalMaxDistance = 5;
      Alert.alert("Distance Limited", "Premium users can search up to 25+ miles. Free tier is limited to 5 miles.");
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
      maxDistance: finalMaxDistance,
      categories: selectedCategories,
      userLocation: useMyAddressEnabled ? actualUserLocation : ADDRESS_OFF_DEFAULT_LOCATION,
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
        <Text
          style={{
            fontWeight: "900",
            fontSize: 36,
            marginVertical: 24,
            color: "#1a1a1a",
          }}
        >
          Plan a Date
        </Text>

        {/* <Text
          style={{
            marginBottom: 22,
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
          }}
        >
          Use a single form to set your preferences, then generate your date
          ideas.
        </Text> */}

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
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Plan Date</Text>
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
                  fontWeight: "800",
                  color: "#007AFF",
                  marginBottom: 2,
                }}
              >
                Unlock Premium
              </Text>
              <Text style={{ fontSize: 13, color: "#0051D5", fontWeight: "500" }}>Save unlimited ideas for only $3.99</Text>
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
        )}

        {__DEV__ && (
          <TouchableOpacity
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#ffe8a3",
              borderWidth: 1,
              borderColor: "#d6b656",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              marginBottom: 16,
            }}
            onPress={() => setUseMyAddressEnabled((prev) => !prev)}
          >
            <Text
              style={{
                color: "#4a3b00",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Use my address: {useMyAddressEnabled ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        )}

        <PlanDateInputsModal
          visible={isModalVisible}
          showDatePicker={showDatePicker}
          selectedDate={selectedDate}
          maxPrice={maxPrice}
          startHour12={startHour12}
          startPeriod={startPeriod}
          endHour12={endHour12}
          endPeriod={endPeriod}
          maxDistance={maxDistance}
          categoriesChecked={categoriesChecked}
          selectedCategoriesCount={selectedCategoriesCount}
          isGeneratingIdeas={isGeneratingIdeas}
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
          onChangeMaxDistance={setMaxDistance}
          onToggleCategory={toggleCategory}
          onSubmit={handleGenerateIdeas}
        />

        <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
