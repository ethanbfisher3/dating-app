import React from "react"
import { ScrollView, Text } from "react-native"

export default function RecipesPage() {
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
        Recipe Ideas
      </Text>
      <Text
        style={{
          marginBottom: 20,
          fontSize: 17,
          lineHeight: 26,
          color: "#555",
        }}
      >
        Here are a list of a few recipes that you can cook up for a date.
        They're fast, simple, and affordable. We're sure they will help girls
        fall in love with you.
      </Text>
    </ScrollView>
  )
}
