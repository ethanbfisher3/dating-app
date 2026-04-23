import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AppNavigation } from "../types/navigation";
import DateIdeaCard from "../Components/DateIdeaCard";
import { activities } from "../data/activities";
import type { PlaceSummary } from "../hooks/useDatePlannerIdeas";
import {
  FREE_TIER_SAVED_IDEAS_LIMIT,
  getSavedIdeas,
  initializeSavedIdeas,
  removeSavedIdea,
  subscribeSavedIdeas,
  type SavedDateIdea,
} from "../data/savedIdeasStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePremium } from "../hooks/usePremium";
import PaywallModal from "../Components/PaywallModal";
import usePurchases from "src/hooks/usePurchases";
import PageInfoModal from "../Components/PageInfoModal";

export default function SavedIdeas({ navigation }: { navigation: AppNavigation }) {
  const { lifetimePremium } = usePurchases();
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>([]);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const { isUnlocked } = usePremium();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;

    const load = () => {
      if (!isMounted) {
        return;
      }
      setSavedIdeas(getSavedIdeas());
    };

    void initializeSavedIdeas().then(load);

    const unsubscribe = subscribeSavedIdeas(load);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingTop: insets.top,
        backgroundColor: "#fafbfc",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginVertical: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 8,
            flex: 1,
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              fontSize: 36,
              color: "#1a1a1a",
            }}
          >
            Saved Ideas
          </Text>
          {!isUnlocked ? (
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#6b7280",
                marginBottom: 6,
              }}
            >
              ({savedIdeas.length} / {FREE_TIER_SAVED_IDEAS_LIMIT})
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#eef5ff",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 6,
          }}
          onPress={() => setInfoVisible(true)}
        >
          <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../assets/images/thinking.jpg")}
        style={{
          width: "100%",
          height: 200,
          borderRadius: 12,
          marginBottom: 20,
        }}
      />

      {lifetimePremium ? (
        !isUnlocked ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPaywallVisible(true)}
            style={{
              backgroundColor: "#f0f7ff",
              borderRadius: 12,
              borderWidth: 2,
              borderColor: "#007AFF",
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ionicons name="star" size={28} color="#007AFF" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#007AFF",
                  marginBottom: 2,
                }}
              >
                Unlock Premium
              </Text>
              <Text style={{ fontSize: 13, color: "#0051D5", fontWeight: "500" }}>
                Save unlimited ideas for only {lifetimePremium.priceString}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        ) : (
          <View
            style={{
              backgroundColor: "#eefaf0",
              borderRadius: 12,
              borderWidth: 2,
              borderColor: "#2e9f5b",
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ionicons name="checkmark-circle" size={28} color="#2e9f5b" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#2e9f5b",
                  marginBottom: 2,
                }}
              >
                You are a premium user
              </Text>
              <Text style={{ fontSize: 13, color: "#1f7a45", fontWeight: "500" }}>You can save unlimited date ideas.</Text>
            </View>
          </View>
        )
      ) : null}

      {savedIdeas.length === 0 ? (
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#dce6ef",
            padding: 16,
          }}
        >
          <Text style={{ color: "#4b5b6b", fontSize: 16 }}>No saved date ideas yet. Save one from Planned Date Results.</Text>
        </View>
      ) : null}

      {savedIdeas.map((idea, index) => {
        const places = Object.values(idea.places || {}).filter((place): place is PlaceSummary => Boolean(place));
        const schedule = idea.schedule || [];

        return (
          <DateIdeaCard
            key={idea.id}
            index={index}
            titlePrefix="Saved Idea"
            filledTemplate={idea.filledTemplate}
            schedule={schedule}
            places={places}
            commuteToFirstMinutes={idea.commuteToFirstMinutes}
            commuteFromLastMinutes={idea.commuteFromLastMinutes}
            navigation={navigation}
            recipeIndex={idea.recipeIndex}
            primaryActionLabel="Remove"
            primaryActionColor="#dc3545"
            onPrimaryAction={() => {
              Alert.alert("Remove date idea?", "Are you sure you want to remove this saved idea?", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () => removeSavedIdea(idea.id),
                },
              ]);
            }}
          />
        );
      })}

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} reason="general" />
      <PageInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description="This page stores date ideas you saved from generated results so you can revisit them anytime."
        bullets={[
          "Open any card to view all activities, places, and timing details.",
          "Tap Remove if you no longer want to keep an idea.",
          "Your saved ideas are stored on-device and loaded when the app opens.",
        ]}
      />
    </ScrollView>
  );
}
