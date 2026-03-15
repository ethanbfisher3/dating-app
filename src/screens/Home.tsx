import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { ScrollView, Text, View, TouchableOpacity } from "react-native"
import appInfo from "src/data/info"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function Info({ goToTab }) {
  const [expandedOffers, setExpandedOffers] = useState({
    dateHistory: false,
    datePlanner: false,
    recipeIdeas: false,
    savedIdeas: false,
  })

  const insets = useSafeAreaInsets()

  const toggleOffer = (offerKey: keyof typeof expandedOffers) => {
    setExpandedOffers((previous) => ({
      ...previous,
      [offerKey]: !previous[offerKey],
    }))
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingTop: insets.top,
        backgroundColor: "#fafbfc",
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 36,
          marginVertical: 24,
          color: "#1a1a1a",
        }}
      >
        {appInfo.appName}
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
          {appInfo.appName} is your ultimate companion for planning
          unforgettable dates in the Provo, Utah area.
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
        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => goToTab?.("Date History")}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#f05a7e"
                />{" "}
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
                Dating History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleOffer("dateHistory")}
            >
              <Ionicons
                name={
                  expandedOffers.dateHistory ? "chevron-up" : "chevron-down"
                }
                size={20}
                color="#1e90ff"
              />
            </TouchableOpacity>
          </View>

          {expandedOffers.dateHistory && (
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
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => goToTab?.("Date Planner")}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#f05a7e"
                />{" "}
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
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleOffer("datePlanner")}
            >
              <Ionicons
                name={
                  expandedOffers.datePlanner ? "chevron-up" : "chevron-down"
                }
                size={20}
                color="#1e90ff"
              />
            </TouchableOpacity>
          </View>

          {expandedOffers.datePlanner && (
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: "#555",
                marginLeft: 12,
              }}
            >
              Answer a few questions and get personalized date recommendations
              based on your preferences.
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => goToTab?.("Recipe Ideas")}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={20}
                  color="#f05a7e"
                />{" "}
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
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleOffer("recipeIdeas")}
            >
              <Ionicons
                name={
                  expandedOffers.recipeIdeas ? "chevron-up" : "chevron-down"
                }
                size={20}
                color="#1e90ff"
              />
            </TouchableOpacity>
          </View>

          {expandedOffers.recipeIdeas && (
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
          )}
        </View>

        {/* <TouchableOpacity
          style={{ marginBottom: 12 }}
          activeOpacity={0.8}
          onPress={() => goToTab?.("Tips")}
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
              💡{" "}
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
              Tips for finding a Date
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
            Is dating tough for you? Here's some motivation!
          </Text>
        </TouchableOpacity> */}

        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => goToTab?.("Saved Ideas")}
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color="#f05a7e"
                />{" "}
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
                Save Your Favorite Ideas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleOffer("savedIdeas")}
            >
              <Ionicons
                name={expandedOffers.savedIdeas ? "chevron-up" : "chevron-down"}
                size={20}
                color="#1e90ff"
              />
            </TouchableOpacity>
          </View>

          {expandedOffers.savedIdeas && (
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: "#555",
                marginLeft: 12,
              }}
            >
              Do you like some of the date ideas? Save them to view later.
            </Text>
          )}
        </View>
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

      {/* <View
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
      </View> */}
    </ScrollView>
  )
}
