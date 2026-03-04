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
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              What's your budget?
            </Text>
            <Text style={{ marginVertical: 10 }}>
              Up to ${maxPrice} {maxPrice === 0 ? "(Free Only)" : ""}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                padding: 10,
                width: "100%",
                marginBottom: 10,
              }}
              keyboardType="numeric"
              value={String(maxPrice)}
              onChangeText={(text) => {
                const num = parseInt(text) || 0
                setMaxPrice(num)
              }}
              placeholder="Enter your budget (0-100)"
            />
            <Button title="Next" onPress={handleNextQuestion} />
          </View>
        )
      case 2:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              When is your date?
            </Text>
            <TouchableOpacity
              style={{
                padding: 10,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                marginVertical: 10,
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{selectedDate ? selectedDate : "Select a date"}</Text>
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
              <Text style={{ color: "red" }}>
                Please select a date before continuing.
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <Button title="Back" onPress={handlePreviousQuestion} />
              <Button title="Next" onPress={handleNextQuestion} />
            </View>
          </View>
        )
      case 3:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              What time of day?
            </Text>
            <Text
              style={{ marginVertical: 10 }}
            >{`${startHour < 12 ? startHour : startHour === 12 ? 12 : startHour - 12}${startHour < 12 ? " AM" : " PM"} - ${endHour < 12 ? endHour : endHour === 12 ? 12 : endHour - 12}${endHour < 12 ? " AM" : " PM"}`}</Text>
            {/* Replace with dropdowns or pickers for start/end time */}
            <Button title="Back" onPress={handlePreviousQuestion} />
            <Button title="Next" onPress={handleNextQuestion} />
          </View>
        )
      case 4:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              How far are you willing to travel?
            </Text>
            <Text style={{ marginVertical: 10 }}>
              Up to {maxDistance} miles from BYU Campus
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                padding: 10,
                width: "100%",
                marginBottom: 10,
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
              }}
            >
              <Button title="Back" onPress={handlePreviousQuestion} />
              <Button title="Next" onPress={handleNextQuestion} />
            </View>
          </View>
        )
      case 5:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              Starving Student Card?
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 20,
              }}
            >
              <Switch
                value={hasStarvingStudentCard}
                onValueChange={setHasStarvingStudentCard}
              />
              <Text style={{ marginLeft: 10 }}>
                Yes, I have a Starving Student Card
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#666", marginTop: 10 }}>
              {hasStarvingStudentCard
                ? "Great! We'll include date ideas that offer discounts with the Starving Student Card, even if they're above your budget."
                : "If you have a Starving Student Card, check this box to see more discounted options!"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <Button title="Back" onPress={handlePreviousQuestion} />
              <Button title="Next" onPress={handleNextQuestion} />
            </View>
          </View>
        )
      case 6:
        return (
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              Select interests for this date
            </Text>
            {dateCategories.map((category, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 5,
                }}
              >
                <Switch
                  value={categoriesChecked[index]}
                  onValueChange={(value) => {
                    const newChecked = [...categoriesChecked]
                    newChecked[index] = value
                    setCategoriesChecked(newChecked)
                  }}
                />
                <Text style={{ marginLeft: 10 }}>{category}</Text>
              </View>
            ))}
            {categoriesChecked.every((checked) => !checked) && (
              <Text style={{ color: "red", marginTop: 10 }}>
                Please check at least one category.
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <Button title="Back" onPress={handlePreviousQuestion} />
              <Button
                title="Generate Date Ideas"
                onPress={handleNextQuestion}
                disabled={categoriesChecked.every((checked) => !checked)}
              />
            </View>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginVertical: 20 }}>
        Plan a Date
      </Text>
      <Text style={{ marginBottom: 10 }}>
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
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor:
                    question <= currentQuestion ? "#007AFF" : "#e0e0e0",
                  marginHorizontal: 3,
                }}
              />
            ),
          )}
        </View>
        <Text style={{ fontSize: 14, color: "#666" }}>
          Question {currentQuestion} of {questionCount}
        </Text>
      </View>
      {renderQuestion()}
    </ScrollView>
  )
}
