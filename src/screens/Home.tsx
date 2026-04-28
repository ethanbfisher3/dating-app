import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, Image } from "react-native";
import appInfo from "src/data/info";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "../Components/PaywallModal";
import DateCalendar from "./DateCalendar";

export default function Info({ goToTab }) {
  const [expandedOffers, setExpandedOffers] = useState({
    dateHistory: true,
    datePlanner: true,
    recipeIdeas: true,
    savedIdeas: true,
  });
  const [paywallVisible, setPaywallVisible] = useState(false);
  const { isUnlocked, resetPremium } = usePremium();

  const insets = useSafeAreaInsets();

  const toggleOffer = (offerKey: keyof typeof expandedOffers) => {
    setExpandedOffers((previous) => ({
      ...previous,
      [offerKey]: !previous[offerKey],
    }));
  };

  const handleRemovePremium = async () => {
    try {
      await resetPremium();
      Alert.alert("Premium Removed", "Premium access has been reset for testing.");
    } catch (error) {
      console.error("Reset premium error:", error);
      Alert.alert("Error", "Could not reset premium access.");
    }
  };

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

      <View style={{ width: "100%" }}>
        <Image
          source={require("../assets/images/date_planner_icon.png")}
          style={{
            height: 300,
            width: "100%",
            marginBottom: 20,
            borderRadius: 12,
          }}
        />
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
                  marginBottom: 6,
                }}
              >
                <MaterialCommunityIcons name="clock-outline" size={20} color="#f05a7e" />{" "}
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

            {/* <TouchableOpacity activeOpacity={0.8} onPress={() => toggleOffer("dateHistory")}>
              <Ionicons name={expandedOffers.dateHistory ? "chevron-up" : "chevron-down"} size={20} color="#1e90ff" />
            </TouchableOpacity> */}
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
              Curated list of date spots, from outdoor adventures to cozy cafes.
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
              onPress={() => goToTab?.("DateCraft")}
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
                <Ionicons name="calendar-outline" size={20} color="#f05a7e" />{" "}
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

            {/* <TouchableOpacity activeOpacity={0.8} onPress={() => toggleOffer("datePlanner")}>
              <Ionicons name={expandedOffers.datePlanner ? "chevron-up" : "chevron-down"} size={20} color="#1e90ff" />
            </TouchableOpacity> */}
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
              Answer a few questions and get personalized date recommendations based on your preferences.
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
                <Ionicons name="fast-food-outline" size={20} color="#f05a7e" />{" "}
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

            {/* <TouchableOpacity activeOpacity={0.8} onPress={() => toggleOffer("recipeIdeas")}>
              <Ionicons name={expandedOffers.recipeIdeas ? "chevron-up" : "chevron-down"} size={20} color="#1e90ff" />
            </TouchableOpacity> */}
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
              Simple, affordable recipes perfect for cooking together on a date night.
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
              onPress={() => goToTab?.("Saved Ideas")}
              style={{ flexDirection: "row", alignItems: "center", flex: 1, marginBottom: 6 }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                }}
              >
                <Ionicons name="bookmark-outline" size={20} color="#f05a7e" />{" "}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1a1a1a",
                  textDecorationLine: "underline",
                }}
              >
                Save Your Favorite Ideas
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity activeOpacity={0.8} onPress={() => toggleOffer("savedIdeas")}>
              <Ionicons name={expandedOffers.savedIdeas ? "chevron-up" : "chevron-down"} size={20} color="#1e90ff" />
            </TouchableOpacity> */}
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

      {__DEV__ && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleRemovePremium}
          disabled={!isUnlocked}
          style={{
            backgroundColor: isUnlocked ? "#fff5f5" : "#f3f4f6",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: isUnlocked ? "#d93025" : "#c9ced6",
            opacity: isUnlocked ? 1 : 0.8,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: isUnlocked ? "#d93025" : "#697281",
              fontWeight: "800",
              fontSize: 15,
            }}
          >
            {isUnlocked ? "Remove Premium (DEV)" : "Premium Already Removed (DEV)"}
          </Text>
        </TouchableOpacity>
      )}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />
    </ScrollView>
  );
}
