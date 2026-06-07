import { Ionicons } from "@expo/vector-icons";
import { ScrollView, View, TouchableOpacity, Alert, Image } from "react-native";
import Text from "../Components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import { useState } from "react";
import PaywallModal from "../Components/PaywallModal";

export default function Info({ goToTab }) {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const { isUnlocked, resetPremium } = usePremium();

  const insets = useSafeAreaInsets();

  const offers = [
    {
      title: "Dating History",
      icon: "time-outline" as const,
      description: "Curated list of date spots, from outdoor adventures to cozy cafes.",
      onPress: () => goToTab?.("Date History"),
    },
    {
      title: "Smart Date Planner",
      icon: "calendar-outline" as const,
      description: "Answer a few questions and get personalized date recommendations based on your preferences.",
      onPress: () => goToTab?.("DateCraft"),
    },
    {
      title: "Recipe Ideas",
      icon: "fast-food-outline" as const,
      description: "Simple, affordable recipes perfect for cooking together on a date night.",
      onPress: () => goToTab?.("Recipe Ideas"),
    },
    {
      title: "Save Your Favorite Ideas",
      icon: "bookmark-outline" as const,
      description: "Do you like some of the date ideas? Save them to view later.",
      onPress: () => goToTab?.("Saved Ideas"),
    },
  ];

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
        backgroundColor: "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: "SuperPandora",
          fontSize: 36,
          marginVertical: 24,
          color: "#1a1a1a",
        }}
      >
        DateCraft
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

      <View>
        <Text
          style={{
            fontSize: 24,
            marginBottom: 12,
            color: "#1e90ff",
            fontFamily: "SuperPandora",
          }}
        >
          What We Offer
        </Text>
        <View style={{ gap: 12 }}>
          {offers.map((offer) => (
            <View
              key={offer.title}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
                borderWidth: 1,
                borderColor: "#edf1f7",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={offer.onPress}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#fff2f6",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={offer.icon} size={20} color="#f05a7e" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontFamily: "MatchaCih",
                        color: "#1a1a1a",
                        marginBottom: 4,
                      }}
                    >
                      {offer.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 20,
                        color: "#5f6773",
                      }}
                    >
                      {offer.description}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#9aa3af" />
              </TouchableOpacity>
            </View>
          ))}
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
            marginVertical: 20,
            borderWidth: 1,
            borderColor: isUnlocked ? "#d93025" : "#c9ced6",
            opacity: isUnlocked ? 1 : 0.8,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: isUnlocked ? "#d93025" : "#697281",
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
