import React from "react"
import { ScrollView, Text } from "react-native"
import appInfo from "src/data/info"

export default function Contact() {
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
        Thank you for visiting {appInfo.appName}!
      </Text>
      <Text
        style={{
          fontSize: 18,
          marginBottom: 20,
          lineHeight: 28,
          color: "#555",
        }}
      >
        If you have questions or would like to see something in the website,
        please email byudating@outlook.com
      </Text>
    </ScrollView>
  )
}
