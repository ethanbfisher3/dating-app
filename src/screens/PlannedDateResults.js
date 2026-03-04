import React from "react"
import { View, Text } from "react-native"

export default function PlannedDateResults() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginVertical: 20 }}>
        Planned Date Results
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Here are your personalized date ideas based on your answers. Explore the
        options and pick your favorite!
      </Text>
    </View>
  )
}
