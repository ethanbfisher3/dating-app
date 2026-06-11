import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, TouchableOpacity, Image, TextInput } from "react-native";
import Text from "../Components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import recipes from "../data/Recipes";
import { resolveRecipeImage } from "../data/recipeImageResolver";
import type { AppNavigation } from "../types/navigation";
import PageInfoModal from "../Components/PageInfoModal";
import {
  initializeFavoriteRecipes,
  getFavoriteRecipes,
  toggleFavoriteRecipe,
  subscribeFavoriteRecipes,
} from "../data/favoriteRecipesStore";

const RECIPES_PER_PAGE = 12;

function getPriceTier(price: number): string {
  if (price <= 5) return "$";
  if (price <= 10) return "$$";
  return "$$$";
}

export default function RecipesPage({ navigation }: { navigation: AppNavigation }) {
  const insets = useSafeAreaInsets();
  const [budget, setBudget] = useState("");
  const [mealType, setMealType] = useState("");
  const [time, setTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      if (isMounted) setFavorites(getFavoriteRecipes());
    };
    void initializeFavoriteRecipes().then(load);
    const unsubscribe = subscribeFavoriteRecipes(load);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleFilterInputFocus = (event: any) => {
    const target = event?.target;
    if (!target) return;
    setTimeout(() => {
      (scrollRef.current as any)?.scrollResponderScrollNativeHandleToKeyboard?.(target, 120, true);
    }, 120);
  };

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"];

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe, index) => {
      if (favoritesOnly && !favorites.has(index)) return false;
      const budgetNum = budget ? parseFloat(budget) : null;
      const timeNum = time ? parseFloat(time) : null;
      if (budgetNum !== null && recipe.estimatedPrice > budgetNum) return false;
      if (timeNum !== null && recipe.estimatedTime > timeNum) return false;
      if (mealType && !recipe.categories?.includes(mealType)) return false;
      return true;
    });
  }, [budget, mealType, time, favoritesOnly, favorites]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE));
  const pageStartIndex = (currentPage - 1) * RECIPES_PER_PAGE;
  const pagedRecipes = filteredRecipes.slice(pageStartIndex, pageStartIndex + RECIPES_PER_PAGE);
  const pageEndIndex = pageStartIndex + pagedRecipes.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [budget, mealType, time, favoritesOnly]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recipe Ideas</Text>
          <TouchableOpacity style={styles.infoButton} onPress={() => setInfoVisible(true)}>
            <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 16, marginTop: -8 }}>
          Simple, affordable recipes perfect for cooking together on a date night.
        </Text>

        {/* Meal Type Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 20 }}>
          {/* Favorites pill */}
          <TouchableOpacity
            onPress={() => setFavoritesOnly((v) => !v)}
            style={favoritesOnly ? [styles.pillActive, { backgroundColor: "#f05a7e" }] : styles.pill}
          >
            <Ionicons name={favoritesOnly ? "heart" : "heart-outline"} size={14} color={favoritesOnly ? "#fff" : "#999"} />
            <Text style={favoritesOnly ? styles.pillActiveText : styles.pillText}>Favorites</Text>
          </TouchableOpacity>

          {[
            { label: "All", icon: "grid-outline" },
            { label: "Breakfast", icon: "sunny-outline" },
            { label: "Lunch", icon: "partly-sunny-outline" },
            { label: "Dinner", icon: "moon-outline" },
            { label: "Dessert", icon: "ice-cream-outline" },
            { label: "Snack", icon: "leaf-outline" },
          ].map(({ label, icon }) => {
            const isActive = label === "All" ? mealType === "" : mealType === label;
            return isActive ? (
              <TouchableOpacity key={label} onPress={() => setMealType(label === "All" ? "" : label)} style={styles.pillActive}>
                <Ionicons name={icon as any} size={14} color="#fff" />
                <Text style={styles.pillActiveText}>{label}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity key={label} onPress={() => setMealType(label === "All" ? "" : label)} style={styles.pill}>
                <Ionicons name={icon as any} size={14} color="#999" />
                <Text style={styles.pillText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* More Filters */}
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.filterHeader} onPress={() => setFiltersExpanded(!filtersExpanded)}>
            <Text style={styles.filterTitle}>More Filters</Text>
            <Ionicons name={filtersExpanded ? "chevron-up" : "chevron-down"} size={20} color="#555" />
          </TouchableOpacity>
          {filtersExpanded && (
            <>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Cost ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  placeholderTextColor={"#999"}
                  keyboardType="number-pad"
                  value={budget}
                  onChangeText={setBudget}
                  onFocus={handleFilterInputFocus}
                />
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Max Prep Time (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 30"
                  placeholderTextColor={"#999"}
                  keyboardType="number-pad"
                  value={time}
                  onChangeText={setTime}
                  onFocus={handleFilterInputFocus}
                />
              </View>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setBudget("");
                  setMealType("");
                  setTime("");
                }}
              >
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Result count */}
        <Text style={styles.resultCount}>
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
          {filteredRecipes.length > 0 ? ` • ${pageStartIndex + 1}–${pageEndIndex}` : ""}
        </Text>

        {/* Pagination top */}
        {filteredRecipes.length > RECIPES_PER_PAGE && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2-column recipe grid */}
        {filteredRecipes.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="restaurant-outline" size={40} color="#999" />
            <Text style={styles.noResultsText}>No recipes match your filters.</Text>
          </View>
        ) : (
          <View style={styles.recipeGrid}>
            {pagedRecipes.map((recipe, index) => (
              <TouchableOpacity
                key={`${recipe.name}-${pageStartIndex + index}`}
                style={styles.recipeCard}
                activeOpacity={0.88}
                onPress={() => navigation.navigate("RecipeDetail", { index: recipes.indexOf(recipe) })}
              >
                {/* Background image */}
                {recipe.image ? (
                  <Image source={resolveRecipeImage(recipe.image)} style={styles.recipeImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.recipeImage, { backgroundColor: "#e8e8e8" }]} />
                )}

                {/* Favorite button */}
                {(() => {
                  const recipeIndex = recipes.indexOf(recipe);
                  const isFav = favorites.has(recipeIndex);
                  return (
                    <TouchableOpacity
                      style={styles.bookmarkButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavoriteRecipe(recipeIndex);
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name={isFav ? "heart" : "heart-outline"} size={16} color={isFav ? "#f05a7e" : "#fff"} />
                    </TouchableOpacity>
                  );
                })()}

                {/* Bottom overlay */}
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.82)"]} style={styles.cardOverlay}>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {recipe.name}
                  </Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.cardMetaLeft}>
                      <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.75)" />
                      <Text style={styles.cardMetaText}>{recipe.estimatedTime} min</Text>
                    </View>
                    <Text style={styles.cardPrice}>{getPriceTier(recipe.estimatedPrice)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <PageInfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        description="Browse recipes and filter by cost, prep time, and meal type to find options that match your date plan."
        bullets={[
          "Tap a meal type pill to filter by category.",
          "Use More Filters to narrow by budget and prep time.",
          "Tap a card to open full recipe details.",
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    color: "#1a1a1a",
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  // Meal type carousel pills
  pillActive: {
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#007AFF",
  },
  pillActiveText: {
    color: "#fff",
    fontSize: 13,
  },
  pill: {
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 15,
    backgroundColor: "#fafbfc",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillText: {
    color: "#555",
    fontSize: 13,
  },
  // Filter section
  filterSection: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterTitle: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  filterGroup: {
    marginTop: 14,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#fafbfc",
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 13,
    color: "#666",
  },
  // Result count & pagination
  resultCount: {
    fontSize: 12,
    color: "#999",
    marginBottom: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  paginationButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    backgroundColor: "#e5e5ea",
  },
  paginationButtonText: {
    color: "#fff",
    fontSize: 13,
  },
  paginationButtonTextDisabled: {
    color: "#9a9aa1",
  },
  pageIndicator: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontSize: 13,
  },
  noResults: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  noResultsText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
  },
  // 2-column grid
  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  recipeCard: {
    width: "47.5%",
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#e8e8e8",
  },
  recipeImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  bookmarkButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 32,
  },
  cardName: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
  },
  cardPrice: {
    color: "#f05a7e",
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
