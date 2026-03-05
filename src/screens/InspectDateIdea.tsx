import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from "react-native";
import { getDateIdeaById } from "../data/DateIdeas";
import { findDealsForName } from "../data/sscIndex";
import { openWebsite, sanitizeUri } from "../utils/utils";
import type { AppScreenProps } from "../types/navigation";

export default function InspectDateIdea({
  route,
  navigation,
}: AppScreenProps<"InspectDateIdea">) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
    });
  }, [navigation]);
  const { id } = route.params || {};
  const idea = getDateIdeaById(id);
  if (!idea)
    return (
      <View style={{ padding: 20 }}>
        <Text>Not found</Text>
      </View>
    );
  const sscDeals = idea.CanUseSSC ? findDealsForName(idea.name || "") : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {idea.image ? <Image source={idea.image} style={styles.image} /> : null}
      <Text style={styles.title}>{idea.name}</Text>
      <Text style={styles.description}>{idea.description}</Text>
      {idea.website ? (
        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: "#1e90ff",
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 10,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => openWebsite(idea.website)}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
            Open website
          </Text>
        </TouchableOpacity>
      ) : null}
      {idea.locations ? (
        <View
          style={{
            marginTop: 20,
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              fontSize: 20,
              marginBottom: 12,
              color: "#1a1a1a",
            }}
          >
            Locations
          </Text>
          {idea.locations.map((location, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => location.src && openWebsite(location.src)}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={[styles.location, { textDecorationLine: "underline" }]}
              >
                {location.name}{" "}
              </Text>
              <Text style={styles.location}>
                {location.distanceFromCampus
                  ? `· ${location.distanceFromCampus}`
                  : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {sscDeals && sscDeals.length ? (
        <View
          style={{
            marginTop: 20,
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              fontSize: 20,
              marginBottom: 12,
              color: "#1a1a1a",
            }}
          >
            SSC Deals
          </Text>
          {sscDeals.map((d, i) =>
            (() => {
              const dealImage = (d as any).image || (d as any).imgSrc;
              return (
                <View
                  key={i}
                  style={{
                    marginTop: 12,
                    padding: 14,
                    backgroundColor: "#f7fbff",
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 18,
                      color: "#1a1a1a",
                    }}
                  >
                    {d.name}
                  </Text>
                  {d.deal ? (
                    <Text
                      style={{
                        color: "#333",
                        marginTop: 6,
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      {d.deal}
                    </Text>
                  ) : null}
                  {dealImage ? (
                    <Image
                      source={{ uri: dealImage }}
                      style={{
                        width: 120,
                        height: 60,
                        marginTop: 10,
                        borderRadius: 8,
                      }}
                    />
                  ) : null}
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      backgroundColor: "#1e90ff",
                      borderRadius: 8,
                      alignSelf: "flex-start",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                    onPress={() => {
                      const q = encodeURIComponent(
                        `${d.name} starving student card deal`,
                      );
                      const url = `https://www.google.com/search?q=${q}`;
                      Linking.openURL(url).catch(() => {});
                    }}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}
                    >
                      Open deal
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })(),
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fafbfc" },
  image: { width: "100%", height: 240, borderRadius: 12, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  description: { fontSize: 17, color: "#555", lineHeight: 26 },
  link: { color: "#1e90ff", marginTop: 16, fontSize: 18, fontWeight: "600" },
  location: { color: "#444", marginTop: 8, fontSize: 16 },
});
