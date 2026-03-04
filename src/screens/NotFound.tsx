import React from "react"
import { View, Text } from "react-native"

export default function NotFound() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginVertical: 20 }}>
        Page Not Found
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Sorry, the page you're looking for doesn't exist.
      </Text>
    </View>
  )
}
