import { Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import type { AppNavigation } from "../types/navigation";
import type { PlaceSummary } from "../hooks/usePlacesActivitiesRecipes";

type IdeaPlaceLinksProps = {
  places: Array<PlaceSummary | null | undefined>;
  navigation: AppNavigation;
  marginTop?: number;
};

export default function IdeaPlaceLinks({ places, navigation, marginTop = 12 }: IdeaPlaceLinksProps) {
  const resolvedPlaces = places.filter(Boolean) as PlaceSummary[];

  if (!resolvedPlaces.length) {
    return null;
  }

  return (
    <View style={{ marginTop }}>
      {resolvedPlaces.map((place, placeIndex) => (
        <TouchableOpacity
          key={`${place.id}-${placeIndex}`}
          style={{ marginBottom: 10 }}
          onPress={() => {
            if (place.sourceKind === "activity") {
              navigation.navigate("ActivityDetail", { id: place.id });
              return;
            }
            const lat = place.location?.latitude;
            const lng = place.location?.longitude;
            const label = place.name || "Location";
            const pinLabel = encodeURIComponent(label);
            const url = Platform.select({
              ios: `maps:${lat},${lng}?q=${pinLabel}`,
              android: `geo:${lat},${lng}?q=${lat},${lng}${label ? `(${pinLabel})` : ""}`,
            });
            if (Linking.canOpenURL(url)) {
              Linking.openURL(url);
            }
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: "#1e90ff",
              textDecorationLine: "underline",
              fontWeight: "700",
            }}
          >
            {place.name}
          </Text>
          {place.address ? <Text style={{ color: "#667788", marginTop: 2 }}>{place.address}</Text> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}
