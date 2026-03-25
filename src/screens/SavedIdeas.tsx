import React, { useEffect, useState } from "react"
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { AppNavigation } from "../types/navigation"
import IdeaPlaceLinks from "../Components/IdeaPlaceLinks"
import {
  getSavedIdeas,
  removeSavedIdea,
  subscribeSavedIdeas,
  type SavedDateIdea,
} from "../data/savedIdeasStore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { usePremium } from "../hooks/usePremium"
import PaywallModal from "../Components/PaywallModal"

export default function SavedIdeas({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>(getSavedIdeas())
  const [paywallVisible, setPaywallVisible] = useState(false)
  const { isUnlocked } = usePremium()

  const insets = useSafeAreaInsets()

  useEffect(() => {
    return subscribeSavedIdeas(() => {
      setSavedIdeas(getSavedIdeas())
    })
  }, [])

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
        Saved Ideas
      </Text>

      {!isUnlocked ? (
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
              Save unlimited ideas for only $3.99
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
            <Text style={{ fontSize: 13, color: "#1f7a45", fontWeight: "500" }}>
              You can save unlimited date ideas.
            </Text>
          </View>
        </View>
      )}

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
          <Text style={{ color: "#4b5b6b", fontSize: 16 }}>
            No saved date ideas yet. Save one from Planned Date Results.
          </Text>
        </View>
      ) : null}

      {savedIdeas.map((idea, index) => {
        const places = Object.values(idea.places || {}).filter(Boolean)

        return (
          <View
            key={idea.id}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#dce6ef",
              padding: 16,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "800", color: "#1f2d3d" }}
              >
                Saved Idea {index + 1}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Remove date idea?",
                    "Are you sure you want to remove this saved idea?",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => removeSavedIdea(idea.id),
                      },
                    ],
                  )
                }}
                style={{
                  alignSelf: "flex-end",
                  backgroundColor: "#dc3545",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Remove</Text>
              </TouchableOpacity>
            </View>
            <Text
              style={{
                marginTop: 8,
                fontSize: 17,
                lineHeight: 26,
                color: "#2c3e50",
                fontWeight: "600",
              }}
            >
              {idea.filledTemplate}
            </Text>

            {typeof idea.recipeIndex === "number" ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("RecipeDetail", {
                    index: idea.recipeIndex as number,
                  })
                }
                style={{ marginTop: 8 }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: "#1e90ff",
                    textDecorationLine: "underline",
                    fontWeight: "700",
                  }}
                >
                  View recipe details
                </Text>
              </TouchableOpacity>
            ) : null}

            {places.length ? (
              <IdeaPlaceLinks places={places} navigation={navigation} />
            ) : null}
          </View>
        )
      })}

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        reason="general"
      />
    </ScrollView>
  )
}
