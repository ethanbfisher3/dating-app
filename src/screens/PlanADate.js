import React, { useState } from "react"
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
} from "react-native"
import { EvilIcons, Entypo, Foundation, FontAwesome } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"

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

export default function PlanADate({ navigation }) {
  const [maxPrice, setMaxPrice] = useState(50)
  const [hasStarvingStudentCard, setHasStarvingStudentCard] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startHour, setStartHour] = useState(12)
  const [endHour, setEndHour] = useState(18)
  const [maxDistance, setMaxDistance] = useState(10)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [showDateError, setShowDateError] = useState(false)
  const [categoriesChecked, setCategoriesChecked] = useState(
    Array(dateCategories.length).fill(true),
  )

  const handleNextQuestion = () => {
    if (currentQuestion === 2 && !selectedDate) {
      setShowDateError(true)
      return
    }
    setShowDateError(false)
    if (currentQuestion < questionCount) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleGenerateIdeas()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleGenerateIdeas = () => {
    const selectedCategories = dateCategories.filter(
      (_, i) => categoriesChecked[i],
    )
    navigation.navigate("PlannedDateResults", {
      maxPrice,
      hasStarvingStudentCard,
      selectedDate,
      startHour,
      endHour,
      maxDistance,
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
              Up to ${maxPrice} {maxPrice === 0 ? "(Free Only)" : ""}
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
              value={String(maxPrice)}
              onChangeText={(text) => {
                const num = parseInt(text) || 0
                setMaxPrice(num)
              }}
              placeholder="Enter your budget (0-100)"
            />
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
                {selectedDate ? selectedDate : "Select a date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate ? new Date(selectedDate) : new Date()}
                mode="date"
                display="calendar"
                onChange={(event, date) => {
                  setShowDatePicker(false)
                  if (date) {
                    setSelectedDate(date.toLocaleDateString())
                  }
                }}
              />
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
            >{`${startHour < 12 ? startHour : startHour === 12 ? 12 : startHour - 12}${startHour < 12 ? " AM" : " PM"} - ${endHour < 12 ? endHour : endHour === 12 ? 12 : endHour - 12}${endHour < 12 ? " AM" : " PM"}`}</Text>
            {/* Replace with dropdowns or pickers for start/end time */}
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
              Up to {maxDistance} miles from BYU Campus
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
              value={String(maxDistance)}
              onChangeText={(text) => {
                const num = parseInt(text) || 1
                setMaxDistance(num)
              }}
              placeholder="Enter max distance (1-30)"
            />
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
                backgroundColor: "#f8f9fa",
                padding: 16,
                borderRadius: 10,
              }}
            >
              <Switch
                value={hasStarvingStudentCard}
                onValueChange={setHasStarvingStudentCard}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={hasStarvingStudentCard ? "#1e90ff" : "#f4f3f4"}
              />
              <Text
                style={{
                  marginLeft: 14,
                  fontSize: 17,
                  fontWeight: "600",
                  color: "#2c3e50",
                }}
              >
                Yes, I have a Starving Student Card
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
                ? "Great! We'll include date ideas that offer discounts with the Starving Student Card, even if they're above your budget."
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
            {dateCategories.map((category, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 8,
                  backgroundColor: "#f8f9fa",
                  padding: 14,
                  borderRadius: 10,
                }}
              >
                <Switch
                  value={categoriesChecked[index]}
                  onValueChange={(value) => {
                    const newChecked = [...categoriesChecked]
                    newChecked[index] = value
                    setCategoriesChecked(newChecked)
                  }}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={categoriesChecked[index] ? "#1e90ff" : "#f4f3f4"}
                />
                <Text
                  style={{
                    marginLeft: 14,
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#2c3e50",
                  }}
                >
                  {category}
                </Text>
              </View>
            ))}
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
                  Generate Date Ideas
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
    <ScrollView
      contentContainerStyle={{ padding: 24, backgroundColor: "#fafbfc" }}
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
      {/* Example usage: <EvilIcons name="some-icon" size={24} color="black" /> */}
      {/* Custom Slider implementation using React Native's Slider (if available) or a simple input */}
      <View style={{ width: "80%", marginVertical: 20 }}>
        <Text>Choose a value:</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text>Min</Text>
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            {/* Replace with your slider logic or use a simple input */}
            {/* Example: <Slider value={sliderValue} onValueChange={setSliderValue} minimumValue={0} maximumValue={10} /> */}
          </View>
          <Text>Max</Text>
        </View>
      </View>
      <View style={{ marginBottom: 40, alignItems: "center" }}>
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
      {renderQuestion()}
    </ScrollView>
  )
}
