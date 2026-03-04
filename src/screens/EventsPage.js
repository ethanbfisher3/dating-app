import React from "react"
import { View, Text } from "react-native"

export default function EventsPage() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginVertical: 20 }}>
        On-Campus Events
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Find events at BYU where you can meet girls and make new friends. Check
        out the latest activities, club meetings, and more happening on campus!
      </Text>
    </View>
  )
}
