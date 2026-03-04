import React from "react"
import { ScrollView, Text } from "react-native"

export default function Clubs() {
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
        Clubs to get GIRLS
      </Text>
      <Text
        style={{
          marginBottom: 20,
          fontSize: 17,
          lineHeight: 26,
          color: "#555",
        }}
      >
        Clubs are a great way to get to know people who have similar interests
        as you. Listed below are some clubs that can help you find the girl of
        your dreams.
      </Text>
    </ScrollView>
  )
}
