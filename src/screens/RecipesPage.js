import React from "react"
import { View, Text } from "react-native"

export default function RecipesPage() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginVertical: 20 }}>
        Recipe Ideas
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Here are a list of a few recipes that you can cook up for a date.
        They're fast, simple, and affordable. We're sure they will help girls
        fall in love with you.
      </Text>
    </View>
  )
}
