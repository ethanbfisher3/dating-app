import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import * as ExpoLocation from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import dateideas, { milesBetween } from "../data/DateIdeas";
import type { GeoLocation } from "../data/DateIdeas";
import DateIdeaBox from "../Components/DateIdeaBox";
import type { AppNavigation } from "../types/navigation";

export default function DateIdeasScreen({
  navigation,
}: {
  navigation: AppNavigation;
}) {
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [maxMoney, setMaxMoney] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [category, setCategory] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    const loadUserLocation = async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    };

    loadUserLocation().catch(() => {});
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(dateideas.flatMap((idea) => idea.categories || []).filter(Boolean)),
    );
  }, []);

  const getClosestDistance = (idea: (typeof dateideas)[number]) => {
    if (!userLocation) return null;

    const validLocations = (idea.locations || [])
      .map((location) => location.location)
      .filter(
        (location) =>
          !(location.latitude === 0 && location.longitude === 0) &&
          Number.isFinite(location.latitude) &&
          Number.isFinite(location.longitude),
      );

    if (!validLocations.length) return null;

    return Math.min(
      ...validLocations.map((location) => milesBetween(userLocation, location)),
    );
  };

  const filteredDateIdeas = useMemo(() => {
    return dateideas.filter((idea) => {
      const maxMoneyNum = maxMoney ? parseFloat(maxMoney) : null;
      const maxDistanceNum = maxDistance ? parseFloat(maxDistance) : null;

      const priceMatches =
        !maxMoneyNum ||
        idea.free ||
        (() => {
          const priceNumbers =
            (idea.pricing || "").match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
          if (!priceNumbers.length) return false;
          return Math.min(...priceNumbers) <= maxMoneyNum;
        })();

      const distanceMatches =
        !maxDistanceNum ||
        (() => {
          const closestDistance = getClosestDistance(idea);
          if (closestDistance === null) return !userLocation;
          return closestDistance <= maxDistanceNum;
        })();

      const categoryMatches = !category || idea.categories?.includes(category);

      return priceMatches && distanceMatches && categoryMatches;
    });
  }, [category, maxDistance, maxMoney, userLocation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Date Ideas</Text>
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.filterHeader}
            onPress={() => setFiltersExpanded(!filtersExpanded)}
          >
            <Text style={styles.filterTitle}>Filter Date Ideas</Text>
            <Ionicons
              name={filtersExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color="#1a1a1a"
            />
          </TouchableOpacity>

          {filtersExpanded && (
            <>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Money ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 25"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={maxMoney}
                  onChangeText={setMaxMoney}
                />
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Distance (miles)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 8"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                />
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((itemCategory) => (
                    <TouchableOpacity
                      key={itemCategory}
                      style={[
                        styles.categoryButton,
                        category === itemCategory && styles.categoryButtonActive,
                      ]}
                      onPress={() =>
                        setCategory(category === itemCategory ? "" : itemCategory)
                      }
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          category === itemCategory && styles.categoryTextActive,
                        ]}
                      >
                        {itemCategory}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setMaxMoney("");
                  setMaxDistance("");
                  setCategory("");
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultCount}>
            {filteredDateIdeas.length} idea
            {filteredDateIdeas.length !== 1 ? "s" : ""} found
          </Text>
        </View>

        {filteredDateIdeas.map((item) => (
          <DateIdeaBox
            key={String(item.name)}
            idea={item}
            onPressInspect={(idea) =>
              navigation.navigate("InspectDateIdea", {
                id: idea.id,
                userLocation,
              })
            }
            navigation={navigation}
            userLocation={userLocation}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fafbfc" },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 36,
    paddingBottom: 16,
  },
  title: {
    fontWeight: "900",
    fontSize: 36,
    marginVertical: 0,
    color: "#1a1a1a",
  },
  filterSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filterTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#1a1a1a",
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontWeight: "600",
    fontSize: 13,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#fafbfc",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafbfc",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  categoryTextActive: {
    color: "#fff",
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  resultContainer: {
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    marginBottom: 12,
  },
});
