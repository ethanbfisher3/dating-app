import React from "react"
import { ScrollView, Text } from "react-native"

export default function EventsPage() {
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
        On-Campus Events
      </Text>
      <Text
        style={{
          marginBottom: 20,
          fontSize: 17,
          lineHeight: 26,
          color: "#555",
        }}
      >
        Find events at BYU where you can meet girls and make new friends. Check
        out the latest activities, club meetings, and more happening on campus!
      </Text>
    </ScrollView>
  )
}
