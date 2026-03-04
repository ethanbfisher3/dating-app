import React from "react"
import { ScrollView, Text } from "react-native"

export default function PlannedDateResults() {
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
        Planned Date Results
      </Text>
      <Text
        style={{
          marginBottom: 20,
          fontSize: 17,
          lineHeight: 26,
          color: "#555",
        }}
      >
        Here are your personalized date ideas based on your answers. Explore the
        options and pick your favorite!
      </Text>
    </ScrollView>
  )
}
