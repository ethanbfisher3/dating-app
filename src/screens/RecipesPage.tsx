import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, StyleSheet, View, TouchableOpacity, Image, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import recipes from "../data/Recipes";
import { resolveRecipeImage } from "../data/recipeImageResolver";
import type { AppNavigation } from "../types/navigation";

const RECIPES_PER_PAGE = 10;

export default function RecipesPage({ navigation }: { navigation: AppNavigation }) {
  const insets = useSafeAreaInsets();
  const [budget, setBudget] = useState("");
  const [mealType, setMealType] = useState("");
  const [time, setTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleFilterInputFocus = (event: any) => {
    const target = event?.target;
    if (!target) {
      return;
    }

    setTimeout(() => {
      (scrollRef.current as any)?.scrollResponderScrollNativeHandleToKeyboard?.(target, 120, true);
    }, 120);
  };

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"];

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const budgetNum = budget ? parseFloat(budget) : null;
      const timeNum = time ? parseFloat(time) : null;

      if (budgetNum !== null && recipe.estimatedPrice > budgetNum) {
        return false;
      }

      if (timeNum !== null && recipe.estimatedTime > timeNum) {
        return false;
      }

      if (mealType && !recipe.categories?.includes(mealType)) {
        return false;
      }

      return true;
    });
  }, [budget, mealType, time]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE));
  const pageStartIndex = (currentPage - 1) * RECIPES_PER_PAGE;
  const pagedRecipes = filteredRecipes.slice(pageStartIndex, pageStartIndex + RECIPES_PER_PAGE);
  const pageEndIndex = pageStartIndex + pagedRecipes.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [budget, mealType, time]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{
          padding: 24,
          paddingTop: insets.top,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Recipe Ideas</Text>
          {/* <Text style={styles.subtitle}>
            Fast, simple, and affordable recipes to impress your date.
          </Text> */}
        </View>

        <Image
          source={require("../assets/images/cooking.jpg")}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            marginBottom: 24,
          }}
        />

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.filterHeader} onPress={() => setFiltersExpanded(!filtersExpanded)}>
            <Text style={styles.filterTitle}>Filter Recipes</Text>
            <Ionicons name={filtersExpanded ? "chevron-up" : "chevron-down"} size={24} color="#1a1a1a" />
          </TouchableOpacity>

          {filtersExpanded && (
            <>
              {/* Budget Input */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Cost ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={budget}
                  onChangeText={setBudget}
                  onFocus={handleFilterInputFocus}
                />
              </View>

              {/* Time Input */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Time to Prepare (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 30"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={time}
                  onChangeText={setTime}
                  onFocus={handleFilterInputFocus}
                />
              </View>

              {/* Meal Type Selection */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Meal Type</Text>
                <View style={styles.mealTypeContainer}>
                  {mealTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.mealTypeButton, mealType === type && styles.mealTypeButtonActive]}
                      onPress={() => setMealType(mealType === type ? "" : type)}
                    >
                      <Text style={[styles.mealTypeText, mealType === type && styles.mealTypeTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clear Filters Button */}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setBudget("");
                  setMealType("");
                  setTime("");
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {filteredRecipes.length > RECIPES_PER_PAGE && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recipe List */}
        <View style={styles.recipeListContainer}>
          <Text style={styles.resultCount}>
            {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""} found
            {filteredRecipes.length > 0 ? ` • Showing ${pageStartIndex + 1}-${pageEndIndex}` : ""}
          </Text>
          {filteredRecipes.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No recipes match your filters. Try adjusting your preferences!</Text>
            </View>
          ) : (
            pagedRecipes.map((recipe, index) => (
              <TouchableOpacity
                key={`${recipe.name}-${pageStartIndex + index}`}
                style={styles.recipeCard}
                onPress={() =>
                  navigation.navigate("RecipeDetail", {
                    index: recipes.indexOf(recipe),
                  })
                }
              >
                {recipe.image ? (
                  <Image source={resolveRecipeImage(recipe.image)} style={styles.recipeImage} />
                ) : (
                  <View style={[styles.recipeImage, { backgroundColor: "#e0e0e0" }]} />
                )}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <View style={styles.metaContainer}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="time-outline" size={20} color="#f05a7e" />
                      <Text style={styles.meta}>{recipe.estimatedTime} min</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="cash-outline" size={20} color="#f05a7e" />
                      <Text style={styles.meta}>${recipe.estimatedPrice}</Text>
                    </View>
                  </View>
                  <View style={styles.categoriesContainer}>
                    {recipe.categories.map((cat, i) => (
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  header: {
    paddingBottom: 16,
  },
  title: {
    fontWeight: "900",
    fontSize: 36,
    marginTop: 24,
    marginBottom: 12,
    color: "#1a1a1a",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    color: "#555",
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
  recipeListContainer: {},
  resultCount: {
    paddingLeft: 4,
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
    width: "30%",
    height: "100%",
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
    alignItems: "center",
    gap: 12,
    fontSize: 16,
  },
  meta: {
    fontSize: 16,
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
  paginationContainer: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  paginationButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 86,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#e5e5ea",
  },
  paginationButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  paginationButtonTextDisabled: {
    color: "#9a9aa1",
  },
  pageIndicator: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
});
