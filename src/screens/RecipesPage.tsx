import React, { useState, useMemo } from "react"
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import recipes, { Recipe } from "../data/Recipes"
import { sanitizeUri } from "../utils/imageUtils"

export default function RecipesPage({ navigation }: { navigation: any }) {
  const [budget, setBudget] = useState("")
  const [mealType, setMealType] = useState("")
  const [time, setTime] = useState("")
  const [filtersExpanded, setFiltersExpanded] = useState(true)

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"]

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const budgetNum = budget ? parseFloat(budget) : null
      const timeNum = time ? parseFloat(time) : null

      if (budgetNum !== null && recipe.estimatedPrice > budgetNum) {
        return false
      }

      if (timeNum !== null && recipe.estimatedTime > timeNum) {
        return false
      }

      if (mealType && !recipe.categories?.includes(mealType)) {
        return false
      }

      return true
    })
  }, [budget, mealType, time])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Recipe Ideas</Text>
        <Text style={styles.subtitle}>
          Fast, simple, and affordable recipes to impress your date.
        </Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.filterHeader}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
        >
          <Text style={styles.filterTitle}>Filter Recipes</Text>
          <Ionicons
            name={filtersExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#1a1a1a"
          />
        </TouchableOpacity>

        {filtersExpanded && (
          <>
            {/* Budget Input */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Max Budget ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={budget}
                onChangeText={setBudget}
              />
            </View>

            {/* Time Input */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Max Time (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={time}
                onChangeText={setTime}
              />
            </View>

            {/* Meal Type Selection */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Meal Type</Text>
              <View style={styles.mealTypeContainer}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeButton,
                      mealType === type && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => setMealType(mealType === type ? "" : type)}
                  >
                    <Text
                      style={[
                        styles.mealTypeText,
                        mealType === type && styles.mealTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters Button */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setBudget("")
                setMealType("")
                setTime("")
              }}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Recipe List */}
      <View style={styles.recipeListContainer}>
        <Text style={styles.resultCount}>
          {filteredRecipes.length} recipe
          {filteredRecipes.length !== 1 ? "s" : ""} found
        </Text>
        {filteredRecipes.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
              No recipes match your filters. Try adjusting your preferences!
            </Text>
          </View>
        ) : (
          filteredRecipes.map((recipe, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recipeCard}
              onPress={() =>
                navigation.navigate("RecipeDetail", {
                  index: recipes.indexOf(recipe),
                })
              }
            >
              {recipe.image ? (
                <Image source={recipe.image} style={styles.recipeImage} />
              ) : (
                <View
                  style={[styles.recipeImage, { backgroundColor: "#e0e0e0" }]}
                />
              )}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                  {recipe.description}
                </Text>
                <View style={styles.metaContainer}>
                  <Text style={styles.meta}>⏱ {recipe.estimatedTime} min</Text>
                  <Text style={styles.meta}>💰 ${recipe.estimatedPrice}</Text>
                </View>
                <View style={styles.categoriesContainer}>
                  {recipe.categories &&
                    recipe.categories.slice(0, 2).map((cat, i) => (
                      <View key={i} style={styles.categoryTag}>
                        <Text style={styles.categoryText}>{cat}</Text>
                      </View>
                    ))}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontWeight: "900",
    fontSize: 36,
    marginVertical: 0,
    color: "#1a1a1a",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    color: "#555",
  },
  filterSection: {
    marginHorizontal: 24,
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
  mealTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafbfc",
  },
  mealTypeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  mealTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  mealTypeTextActive: {
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
  recipeListContainer: {
    paddingHorizontal: 24,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    marginBottom: 12,
  },
  noResults: {
    paddingVertical: 32,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: 120,
    height: 120,
    backgroundColor: "#f0f0f0",
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  recipeName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#666",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 12,
  },
  meta: {
    fontSize: 12,
    color: "#777",
    fontWeight: "500",
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: "#f2f6fb",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "600",
  },
})
