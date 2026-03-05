import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import dateideas from "../data/DateIdeas"
import DateIdeaBox from "../Components/DateIdeaBox"
import type { AppNavigation } from "../types/navigation"

export default function DateIdeasScreen({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const [maxDistance, setMaxDistance] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [category, setCategory] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const categories = useMemo(() => {
    return Array.from(
      new Set(dateideas.flatMap((idea) => idea.categories || []).filter(Boolean)),
    )
  }, [])

  const filteredDateIdeas = useMemo(() => {
    return dateideas.filter((idea) => {
      const maxDistanceNum = maxDistance ? parseFloat(maxDistance) : null
      const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null

      const distances = [
        idea.distanceFromCampus,
        ...(idea.locations || [])
          .map((location) =>
            typeof location.distanceFromCampus === "number"
              ? location.distanceFromCampus
              : parseFloat(String(location.distanceFromCampus)),
          )
          .filter((distance) => !Number.isNaN(distance)),
      ].filter((distance): distance is number => typeof distance === "number")

      const closestDistance = distances.length ? Math.min(...distances) : null

      const priceMatches =
        !maxPriceNum ||
        idea.free ||
        (() => {
          const pricingText = idea.pricing || ""
          const priceNumbers =
            pricingText.match(/\d+(?:\.\d+)?/g)?.map(Number) || []
          const minKnownPrice =
            priceNumbers.length > 0 ? Math.min(...priceNumbers) : null

          if (minKnownPrice === null) return false
          return minKnownPrice <= maxPriceNum
        })()

      const distanceMatches =
        !maxDistanceNum ||
        (closestDistance !== null && closestDistance <= maxDistanceNum)

      const categoryMatches = !category || idea.categories?.includes(category)

      return priceMatches && distanceMatches && categoryMatches
    })
  }, [category, maxDistance, maxPrice])

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
                <Text style={styles.filterLabel}>Max Distance (miles)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={maxDistance}
                  onChangeText={setMaxDistance}
                />
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Price ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 20"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
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
                  setMaxDistance("")
                  setMaxPrice("")
                  setCategory("")
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
              navigation.navigate("InspectDateIdea", { id: idea.id })
            }
            navigation={navigation}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fafbfc" },
  scrollContent: {
    paddingBottom: 24,
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
    marginBottom: 8,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  item: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  image: { width: 80, height: 60, marginRight: 10, borderRadius: 6 },
  name: { fontWeight: "700" },
  desc: { color: "#444" },
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
})
