import React, { useEffect, useState } from "react"
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native"
import type { AppNavigation } from "../types/navigation"
import IdeaPlaceLinks from "../Components/IdeaPlaceLinks"
import {
  getSavedIdeas,
  removeSavedIdea,
  subscribeSavedIdeas,
  type SavedDateIdea,
} from "../data/savedIdeasStore"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function SavedIdeas({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>(getSavedIdeas())

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
    </ScrollView>
  )
}
