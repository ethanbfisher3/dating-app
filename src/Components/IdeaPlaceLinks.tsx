import React from "react"
import { Linking, Text, TouchableOpacity, View } from "react-native"
import type { AppNavigation } from "../types/navigation"
import type { PlaceSummary } from "../hooks/usePlacesActivitiesRecipes"

type IdeaPlaceLinksProps = {
  places: Array<PlaceSummary | null | undefined>
  navigation: AppNavigation
  marginTop?: number
}

export default function IdeaPlaceLinks({
  places,
  navigation,
  marginTop = 12,
}: IdeaPlaceLinksProps) {
  const resolvedPlaces = places.filter(Boolean) as PlaceSummary[]

  if (!resolvedPlaces.length) {
    return null
  }

  return (
    <View style={{ marginTop }}>
      {resolvedPlaces.map((place, placeIndex) => (
        <TouchableOpacity
          key={`${place.id}-${placeIndex}`}
          style={{ marginBottom: 10 }}
          disabled={place.sourceKind !== "activity" && !place.googleMapsUri}
          onPress={() => {
            if (place.sourceKind === "activity") {
              navigation.navigate("ActivityDetail", { id: place.id })
              return
            }

            if (place.googleMapsUri) {
              Linking.openURL(place.googleMapsUri)
            }
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: "#1e90ff",
              textDecorationLine:
                place.sourceKind === "activity" || place.googleMapsUri
                  ? "underline"
                  : "none",
              fontWeight: "700",
            }}
          >
            {place.name}
          </Text>
          {place.address ? (
            <Text style={{ color: "#667788", marginTop: 2 }}>
              {place.address}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  )
}
