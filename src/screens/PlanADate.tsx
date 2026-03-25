import React, { useEffect, useMemo, useState } from "react"
import {
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
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as Location from "expo-location"
import type { AppNavigation } from "../types/navigation"
import { DATE_CATEGORIES, timesAreInvalid } from "../utils/utils"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { usePremium } from "../hooks/usePremium"
import { addPlannedDate } from "../data/plannedDatesStore"

export default function PlanADate({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const { isUnlocked } = usePremium()
  const insets = useSafeAreaInsets()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [maxPrice, setMaxPrice] = useState<string>("20")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startHour12, setStartHour12] = useState<string>("12")
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("PM")
  const [endHour12, setEndHour12] = useState<string>("6")
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM")
  const [maxDistance, setMaxDistance] = useState<string>(
    isUnlocked ? "10" : "5",
  )
  const [actualUserLocation, setActualUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [useMyAddressEnabled, setUseMyAddressEnabled] = useState(true)
  const [categoriesChecked, setCategoriesChecked] = useState(
    Array(DATE_CATEGORIES.length).fill(true),
  )

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          return
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        setActualUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      } catch {}
    }

    loadLocation()
  }, [])

  useEffect(() => {
    setMaxDistance((prev) => {
      if (isUnlocked) return prev === "5" ? "10" : prev
      return Number.parseInt(prev, 10) > 5 ? "5" : prev
    })
  }, [isUnlocked])

  const selectedCategoriesCount = useMemo(
    () => categoriesChecked.filter(Boolean).length,
    [categoriesChecked],
  )

  const clampHour12 = (value: number) => {
    if (Number.isNaN(value)) return 1
    if (value < 1) return 1
    if (value > 12) return 12
    return value
  }

  const convertTo24Hour = (hour12: number, period: "AM" | "PM") => {
    let hour24 = hour12
    if (period === "AM") {
      hour24 = hour12 === 12 ? 0 : hour12
    } else {
      hour24 = hour12 === 12 ? 12 : hour12 + 12
    }
    return hour24
  }

  const toggleCategory = (index: number) => {
    const updated = [...categoriesChecked]
    updated[index] = !updated[index]
    setCategoriesChecked(updated)
  }

  const handleGenerateIdeas = () => {
    if (!selectedDate) {
      Alert.alert("Missing Date", "Please select a date.")
      return
    }

    const parsedPrice = Number.parseInt(maxPrice, 10)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Invalid Budget", "Please enter a valid budget.")
      return
    }

    if (
      Number.isNaN(Number.parseInt(startHour12, 10)) ||
      Number.isNaN(Number.parseInt(endHour12, 10)) ||
      timesAreInvalid(startHour12, endHour12, startPeriod, endPeriod)
    ) {
      Alert.alert("Invalid Time", "Please enter valid start and end times.")
      return
    }

    const parsedDistance = Number.parseInt(maxDistance, 10)
    if (Number.isNaN(parsedDistance) || parsedDistance < 0) {
      Alert.alert("Invalid Distance", "Please enter a valid distance.")
      return
    }

    const selectedCategories = DATE_CATEGORIES.filter(
      (_, i) => categoriesChecked[i],
    )
    if (!selectedCategories.length) {
      Alert.alert("No Categories", "Please select at least one category.")
      return
    }

    const start24 = convertTo24Hour(
      Number.parseInt(startHour12, 10),
      startPeriod,
    )
    const end24 = convertTo24Hour(Number.parseInt(endHour12, 10), endPeriod)
    const selectedDateIso = selectedDate.toISOString().slice(0, 10)

    let finalMaxDistance = parsedDistance
    if (!isUnlocked && finalMaxDistance > 5) {
      finalMaxDistance = 5
      Alert.alert(
        "Distance Limited",
        "Premium users can search up to 25+ miles. Free tier is limited to 5 miles.",
      )
    }

    addPlannedDate(selectedDateIso)
    setIsModalVisible(false)

    navigation.navigate("PlannedDateResults", {
      maxPrice: parsedPrice,
      selectedDate: selectedDateIso,
      startHour: start24,
      endHour: end24,
      maxDistance: finalMaxDistance,
      categories: selectedCategories,
      userLocation: useMyAddressEnabled ? actualUserLocation : null,
    })
  }

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
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Plan Date
          </Text>
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
          <Text style={{ color: "#1e90ff", fontSize: 17, fontWeight: "800" }}>
            View Date Calendar
          </Text>
        </TouchableOpacity>

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

        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowDatePicker(false)
            setIsModalVisible(false)
          }}
        >
          <KeyboardAvoidingView
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              padding: 20,
            }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#dce6ef",
                maxHeight: "90%",
                overflow: "hidden",
              }}
            >
              <ScrollView
                showsVerticalScrollIndicator
                contentContainerStyle={{ padding: 16 }}
                keyboardShouldPersistTaps="handled"
              >
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
                      fontSize: 22,
                      fontWeight: "800",
                      color: "#1f2d3d",
                    }}
                  >
                    Plan Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(false)
                      setIsModalVisible(false)
                    }}
                  >
                    <Text
                      style={{
                        color: "#6b7280",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    padding: 12,
                    borderWidth: 2,
                    borderColor: "#1e90ff",
                    borderRadius: 10,
                    marginBottom: 12,
                    backgroundColor: "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: selectedDate ? "#1a1a1a" : "#9ca3af",
                    }}
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString()
                      : "Select a date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 10,
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <DateTimePicker
                      value={selectedDate || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "calendar"}
                      themeVariant={Platform.OS === "ios" ? "light" : undefined}
                      onChange={(event, date) => {
                        if (Platform.OS === "android") {
                          setShowDatePicker(false)
                        }

                        const isConfirmed =
                          Platform.OS === "ios" || event.type === "set"
                        if (isConfirmed && date) {
                          setSelectedDate(date)
                        }
                      }}
                    />
                    {Platform.OS === "ios" ? (
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={{
                          alignItems: "center",
                          paddingVertical: 12,
                          borderTopWidth: 1,
                          borderTopColor: "#dce6ef",
                        }}
                      >
                        <Text
                          style={{
                            color: "#1e90ff",
                            fontWeight: "700",
                            fontSize: 16,
                          }}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
                  Budget
                </Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: "#cdd9e5",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                    marginBottom: 12,
                  }}
                  placeholder="Enter your budget"
                />

                <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Time</Text>
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#6b7280", marginBottom: 4 }}>
                      Start
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={startHour12}
                        onChangeText={(text) => {
                          if (text.trim() === "") {
                            setStartHour12("")
                            return
                          }
                          const parsed = Number.parseInt(text, 10)
                          if (Number.isNaN(parsed)) {
                            setStartHour12("")
                            return
                          }
                          setStartHour12(String(clampHour12(parsed)))
                        }}
                        keyboardType="number-pad"
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: "#cdd9e5",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 10,
                          textAlign: "center",
                        }}
                        placeholder="1-12"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setStartPeriod((prev) =>
                            prev === "AM" ? "PM" : "AM",
                          )
                        }
                        style={{
                          width: 58,
                          borderWidth: 1,
                          borderColor: "#1e90ff",
                          borderRadius: 8,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor:
                            startPeriod === "AM" ? "#1e90ff" : "#fff",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color: startPeriod === "AM" ? "#fff" : "#1e90ff",
                          }}
                        >
                          {startPeriod}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#6b7280", marginBottom: 4 }}>
                      End
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={endHour12}
                        onChangeText={(text) => {
                          if (text.trim() === "") {
                            setEndHour12("")
                            return
                          }
                          const parsed = Number.parseInt(text, 10)
                          if (Number.isNaN(parsed)) {
                            setEndHour12("")
                            return
                          }
                          setEndHour12(String(clampHour12(parsed)))
                        }}
                        keyboardType="number-pad"
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: "#cdd9e5",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 10,
                          textAlign: "center",
                        }}
                        placeholder="1-12"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setEndPeriod((prev) => (prev === "AM" ? "PM" : "AM"))
                        }
                        style={{
                          width: 58,
                          borderWidth: 1,
                          borderColor: "#1e90ff",
                          borderRadius: 8,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor:
                            endPeriod === "AM" ? "#1e90ff" : "#fff",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color: endPeriod === "AM" ? "#fff" : "#1e90ff",
                          }}
                        >
                          {endPeriod}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>
                  Distance (miles)
                </Text>
                <TextInput
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: "#cdd9e5",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                    marginBottom: 10,
                  }}
                />

                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 8,
                    color: "#1a1a1a",
                  }}
                >
                  Categories ({selectedCategoriesCount} selected)
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  {DATE_CATEGORIES.map((category, index) => {
                    const isSelected = categoriesChecked[index]
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleCategory(index)}
                        style={{
                          backgroundColor: isSelected ? "#1e90ff" : "#fff",
                          borderColor: isSelected ? "#1e90ff" : "#b8c2cc",
                          borderWidth: 2,
                          borderRadius: 999,
                          paddingVertical: 9,
                          paddingHorizontal: 14,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: isSelected ? "#fff" : "#2c3e50",
                          }}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <TouchableOpacity
                  onPress={handleGenerateIdeas}
                  style={{
                    backgroundColor: "#28a745",
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}
                  >
                    Generate Date Ideas
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
