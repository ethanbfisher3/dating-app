import React from "react"
import { ScrollView, Text, View, TouchableOpacity } from "react-native"

export default function Info({ goToTab }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingTop: 36, backgroundColor: "#fafbfc" }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 36,
          marginVertical: 24,
          color: "#1a1a1a",
        }}
      >
        Info
      </Text>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#1e90ff",
          }}
        >
          Welcome!
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#555",
            marginBottom: 16,
          }}
        >
          BYUSINGLES is your ultimate companion for planning unforgettable dates
          in the Provo, Utah area.
        </Text>
        {/* <Text style={{ fontSize: 17, lineHeight: 26, color: "#555" }}>
          Whether you're a BYU student looking for creative date ideas, trying
          to plan the perfect evening, or just exploring what Provo has to
          offer, we're here to help you create meaningful connections and
          memorable experiences.
        </Text> */}
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#1e90ff",
          }}
        >
          What We Offer
        </Text>
        <TouchableOpacity
          style={{ marginBottom: 12 }}
          activeOpacity={0.8}
          onPress={() => goToTab?.("Date Ideas")}
        >
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
              }}
            >
              📅{" "}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
                textDecorationLine: "underline",
              }}
            >
              Local Events & Date Ideas
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "#555",
              marginLeft: 12,
            }}
          >
            Curated list of date spots in and around Provo, from outdoor
            adventures to cozy cafes.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginBottom: 12 }}
          activeOpacity={0.8}
          onPress={() => goToTab?.("Date Planner")}
        >
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
              }}
            >
              🎯{" "}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
                textDecorationLine: "underline",
              }}
            >
              Smart Date Planner
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "#555",
              marginLeft: 12,
            }}
          >
            Answer a few questions and get personalized date recommendations
            based on your budget, interests, and preferences.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginBottom: 12 }}
          activeOpacity={0.8}
          onPress={() => goToTab?.("Recipe Ideas")}
        >
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
              }}
            >
              🍳{" "}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a1a",
                marginBottom: 6,
                textDecorationLine: "underline",
              }}
            >
              Recipe Ideas
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "#555",
              marginLeft: 12,
            }}
          >
            Simple, affordable recipes perfect for cooking together on a date
            night.
          </Text>
        </TouchableOpacity>

        {/* <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: 6,
            }}
          >
            💰 Starving Student Card Deals
          </Text>
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: "#555",
              marginLeft: 12,
            }}
          >
            Find places that accept the Starving Student Card to save money on
            your dates.
          </Text>
        </View> */}
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#1e90ff",
          }}
        >
          Our Mission
        </Text>
        <Text style={{ fontSize: 17, lineHeight: 26, color: "#555" }}>
          We believe that great relationships are built on great experiences.
          Our mission is to make date planning easy, affordable, and fun for
          everyone in the Provo area. From first dates to celebrating
          anniversaries, we're here to help you create moments that matter.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 32,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#1e90ff",
          }}
        >
          Get in Touch
        </Text>
        <Text style={{ fontSize: 17, lineHeight: 26, color: "#555" }}>
          Have suggestions, questions, or ideas for new features? We'd love to
          hear from you!
        </Text>
        <Text
          style={{
            fontSize: 17,
            lineHeight: 26,
            color: "#1e90ff",
            fontWeight: "600",
            marginTop: 10,
          }}
        >
          byudating@outlook.com
        </Text>
      </View>
    </ScrollView>
  )
}
