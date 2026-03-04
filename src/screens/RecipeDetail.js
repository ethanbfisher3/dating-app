import React from "react"
import { View, Text } from "react-native"

export default function RecipeDetail() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginVertical: 20 }}>
        Recipe Detail
      </Text>
      <Text style={{ marginBottom: 10 }}>
        View the recipe details, ingredients, and instructions for your selected
        dish. Enjoy cooking and impress your date!
      </Text>
    </View>
  )
}
