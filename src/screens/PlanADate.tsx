import React, { useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import type { AppNavigation } from "../types/navigation"

const dateCategories = [
  "Food",
  "Outdoors",
  "Sports",
  "Nature",
  "Learning",
  "Shopping",
  "Recreation",
]
const questionCount = 6

export default function PlanADate({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const [maxPrice, setMaxPrice] = useState<string>("50")
  const [hasStarvingStudentCard, setHasStarvingStudentCard] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startHour12, setStartHour12] = useState<string>("12")
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("PM")
  const [endHour12, setEndHour12] = useState<string>("6")
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("PM")
  const [maxDistance, setMaxDistance] = useState<string>("10")
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [showDateError, setShowDateError] = useState(false)
  const [showPriceError, setShowPriceError] = useState(false)
  const [showTimeError, setShowTimeError] = useState(false)
  const [showDistanceError, setShowDistanceError] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [categoriesChecked, setCategoriesChecked] = useState(
    Array(dateCategories.length).fill(true),
  )
  const scrollViewRef = useRef<ScrollView>(null)
  const questionTranslateX = useRef(new Animated.Value(0)).current
  const questionOpacity = questionTranslateX.interpolate({
    inputRange: [-80, 0, 80],
    outputRange: [0.75, 1, 0.75],
    extrapolate: "clamp",
  })

  const transitionToQuestion = (nextQuestion: number, direction: number) => {
    if (
      isAnimating ||
      nextQuestion < 1 ||
      nextQuestion > questionCount ||
      nextQuestion === currentQuestion
    ) {
      return
    }

    setIsAnimating(true)
    Animated.timing(questionTranslateX, {
      toValue: direction * -80,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setCurrentQuestion(nextQuestion)
      questionTranslateX.setValue(direction * 80)
      Animated.timing(questionTranslateX, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false)
      })
    })
  }

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

  const formatHour = (hour: number) => {
    const normalized = ((hour % 24) + 24) % 24
    const period = normalized < 12 ? "AM" : "PM"
    const display = normalized % 12 === 0 ? 12 : normalized % 12
    return `${display} ${period}`
  }

  const toggleCategory = (index: number) => {
    const newChecked = [...categoriesChecked]
    newChecked[index] = !newChecked[index]
    setCategoriesChecked(newChecked)
  }

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const handleNextQuestion = () => {
    if (isAnimating) return
    if (currentQuestion === 2 && !selectedDate) {
      setShowDateError(true)
      return
    }
    if (
      currentQuestion === 1 &&
      (Number.isNaN(parseInt(maxPrice)) || parseInt(maxPrice) < 0)
    ) {
      setShowPriceError(true)
      return
    }
    if (
      currentQuestion === 3 &&
      (Number.isNaN(parseInt(startHour12)) || Number.isNaN(parseInt(endHour12)))
    ) {
      setShowTimeError(true)
      return
    }
    if (currentQuestion === 4 && Number.isNaN(parseInt(maxDistance))) {
      setShowDistanceError(true)
      return
    }
    setShowDateError(false)
    setShowPriceError(false)
    setShowTimeError(false)
    setShowDistanceError(false)
    if (currentQuestion < questionCount) {
      transitionToQuestion(currentQuestion + 1, 1)
    } else {
      handleGenerateIdeas()
    }
  }

  const handlePreviousQuestion = () => {
    if (isAnimating) return
    if (currentQuestion > 1) {
      transitionToQuestion(currentQuestion - 1, -1)
    }
  }

  const handleGenerateIdeas = () => {
    const selectedCategories = dateCategories.filter(
      (_, i) => categoriesChecked[i],
    )
    const start24 = convertTo24Hour(parseInt(startHour12), startPeriod)
    const end24 = convertTo24Hour(parseInt(endHour12), endPeriod)
    navigation.navigate("PlannedDateResults", {
      maxPrice: parseInt(maxPrice),
      hasStarvingStudentCard,
      selectedDate: selectedDate ? selectedDate.toLocaleDateString() : "",
      startHour: start24,
      endHour: end24,
      maxDistance: parseInt(maxDistance),
      categories: selectedCategories,
    })
  }

  const renderQuestion = () => {
    switch (currentQuestion) {
      case 1:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 26,
                marginBottom: 12,
                color: "#1a1a1a",
              }}
            >
              What's your budget?
            </Text>
            <Text
              style={{
                marginVertical: 14,
                fontSize: 20,
                fontWeight: "600",
                color: "#2c3e50",
              }}
            >
              Up to ${maxPrice} {parseInt(maxPrice) === 0 ? "(Free Only)" : ""}
            </Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: "#1e90ff",
                borderRadius: 10,
                padding: 16,
                width: "100%",
                marginBottom: 16,
                fontSize: 18,
                backgroundColor: "#fff",
              }}
              keyboardType="number-pad"
              value={String(maxPrice)}
              onChangeText={(text) => setMaxPrice(text)}
              onFocus={handleInputFocus}
              placeholder="Enter your budget (0-100)"
            />
            {showPriceError && (
              <Text style={{ color: "red", fontSize: 16, marginBottom: 12 }}>
                Please enter a valid budget.
              </Text>
            )}
            <TouchableOpacity
              style={{
                backgroundColor: "#1e90ff",
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 10,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleNextQuestion}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )
      case 2:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 26,
                marginBottom: 12,
                color: "#1a1a1a",
              }}
            >
              When is your date?
            </Text>
            <TouchableOpacity
              style={{
                padding: 16,
                borderWidth: 2,
                borderColor: "#1e90ff",
                borderRadius: 10,
                marginVertical: 14,
                backgroundColor: "#fff",
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: selectedDate ? "#1a1a1a" : "#999",
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
                }}
              >
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  themeVariant={Platform.OS === "ios" ? "light" : undefined}
                  onChange={(event, date) => {
                    const isConfirmed =
                      Platform.OS === "ios" || event.type === "set"
                    setShowDatePicker(false)
                    if (isConfirmed && date) {
                      setSelectedDate(date)
                    }
                  }}
                />
              </View>
            )}
            {showDateError && (
              <Text style={{ color: "red", fontSize: 16, marginBottom: 12 }}>
                Please select a date before continuing.
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handlePreviousQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#1e90ff",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={handleNextQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      case 3:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 26,
                marginBottom: 12,
                color: "#1a1a1a",
              }}
            >
              What time of day?
            </Text>
            <Text
              style={{
                marginVertical: 14,
                fontSize: 20,
                fontWeight: "600",
                color: "#2c3e50",
              }}
            >{`${startHour12} ${startPeriod} - ${endHour12} ${endPeriod}`}</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  Start Time
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 2,
                      borderColor: "#1e90ff",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 18,
                      backgroundColor: "#fff",
                      textAlign: "center",
                    }}
                    keyboardType="numeric"
                    value={startHour12}
                    onChangeText={(text) => {
                      const num = clampHour12(parseInt(text) || 0)
                      setStartHour12(String(num))
                    }}
                    onFocus={handleInputFocus}
                    placeholder="1-12"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setStartPeriod(startPeriod === "AM" ? "PM" : "AM")
                    }
                    style={{
                      width: 60,
                      borderWidth: 2,
                      borderColor: "#1e90ff",
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor:
                        startPeriod === "AM" ? "#1e90ff" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  End Time
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 2,
                      borderColor: "#1e90ff",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 18,
                      backgroundColor: "#fff",
                      textAlign: "center",
                    }}
                    keyboardType="numeric"
                    value={endHour12}
                    onChangeText={(text) => {
                      const num = clampHour12(parseInt(text) || 0)
                      setEndHour12(String(num))
                    }}
                    onFocus={handleInputFocus}
                    placeholder="1-12"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setEndPeriod(endPeriod === "AM" ? "PM" : "AM")
                    }
                    style={{
                      width: 60,
                      borderWidth: 2,
                      borderColor: "#1e90ff",
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: endPeriod === "AM" ? "#1e90ff" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
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
            {showTimeError && (
              <Text style={{ color: "red", fontSize: 16, marginBottom: 12 }}>
                Please enter valid start and end times.
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handlePreviousQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#1e90ff",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={handleNextQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      case 4:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 26,
                marginBottom: 12,
                color: "#1a1a1a",
              }}
            >
              How far are you willing to travel?
            </Text>
            <Text
              style={{
                marginVertical: 14,
                fontSize: 20,
                fontWeight: "600",
                color: "#2c3e50",
              }}
            >
              Up to {maxDistance} miles away
            </Text>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: "#1e90ff",
                borderRadius: 10,
                padding: 16,
                width: "100%",
                marginBottom: 16,
                fontSize: 18,
                backgroundColor: "#fff",
              }}
              keyboardType="numeric"
              value={maxDistance}
              onChangeText={(text) => setMaxDistance(text)}
              onFocus={handleInputFocus}
              placeholder="Enter max distance (1-30)"
            />
            {showDistanceError && (
              <Text style={{ color: "red", fontSize: 16, marginBottom: 12 }}>
                Please enter a valid distance.
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handlePreviousQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#1e90ff",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={handleNextQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      case 5:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 26,
                marginBottom: 12,
                color: "#1a1a1a",
              }}
            >
              Starving Student Card?
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 20,
                backgroundColor: "#eaf4ff",
                padding: 16,
                borderRadius: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setHasStarvingStudentCard((prev) => !prev)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: hasStarvingStudentCard ? "#1e90ff" : "#7a8a99",
                  backgroundColor: hasStarvingStudentCard
                    ? "#1e90ff"
                    : "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasStarvingStudentCard ? (
                  <Text
                    style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}
                  >
                    ✓
                  </Text>
                ) : null}
              </TouchableOpacity>
              <Text
                style={{
                  marginLeft: 14,
                  fontSize: 17,
                  fontWeight: "600",
                  color: "#1f2d3d",
                }}
              >
                I have a Starving Student Card
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                color: "#666",
                marginTop: 10,
                lineHeight: 24,
              }}
            >
              {hasStarvingStudentCard
                ? "Great! We'll include date ideas that offer discounts to give you more value for your money."
                : "If you have a Starving Student Card, check this box to see more discounted options!"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handlePreviousQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#1e90ff",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={handleNextQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      case 6:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontWeight: "800",
                fontSize: 26,
                marginBottom: 16,
                color: "#1a1a1a",
              }}
            >
              Select interests for this date
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 8,
              }}
            >
              {dateCategories.map((category, index) => {
                const isSelected = categoriesChecked[index]
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleCategory(index)}
                    style={{
                      backgroundColor: isSelected ? "#1e90ff" : "#ffffff",
                      borderColor: isSelected ? "#1e90ff" : "#b8c2cc",
                      borderWidth: 2,
                      borderRadius: 999,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: isSelected ? "#ffffff" : "#2c3e50",
                      }}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {categoriesChecked.every((checked) => !checked) && (
              <Text style={{ color: "red", marginTop: 10, fontSize: 16 }}>
                Please check at least one category.
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#6c757d",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={handlePreviousQuestion}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#28a745",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                  opacity: categoriesChecked.every((checked) => !checked)
                    ? 0.5
                    : 1,
                }}
                onPress={handleNextQuestion}
                disabled={categoriesChecked.every((checked) => !checked)}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}
                >
                  Finish
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 24,
          paddingTop: 36,
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
        <Text
          style={{
            marginBottom: 20,
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
          }}
        >
          Let's find the perfect date idea for you! We'll ask a few questions to
          personalize your experience.
        </Text>
        <View style={{ marginBottom: 24, alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            {Array.from({ length: questionCount }, (_, i) => i + 1).map(
              (question) => (
                <View
                  key={question}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor:
                      question <= currentQuestion ? "#1e90ff" : "#e0e0e0",
                    marginHorizontal: 5,
                    shadowColor:
                      question <= currentQuestion ? "#1e90ff" : "transparent",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: question <= currentQuestion ? 2 : 0,
                  }}
                />
              ),
            )}
          </View>
          <Text style={{ fontSize: 16, color: "#666", fontWeight: "600" }}>
            Question {currentQuestion} of {questionCount}
          </Text>
        </View>
        <Animated.View
          style={{
            transform: [{ translateX: questionTranslateX }],
            opacity: questionOpacity,
          }}
        >
          {renderQuestion()}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
