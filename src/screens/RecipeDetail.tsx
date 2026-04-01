import React, { useLayoutEffect } from "react";
import { View, Text, Image, ScrollView, StyleSheet, SectionList } from "react-native";
import { getRecipeByIndex } from "../data/Recipes";
import { sanitizeUri } from "../utils/utils";
import type { AppScreenProps } from "../types/navigation";

export default function RecipeDetail({ route, navigation }: AppScreenProps<"RecipeDetail">) {
  const { index } = route.params || {};
  const recipe = getRecipeByIndex(index);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
      title: recipe.name + " Recipe",
    });
  }, [navigation]);

  if (!recipe) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  const imageUri = sanitizeUri(recipe.image);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* {imageUri && (
        <View style={styles.imageParent}>
          <Image source={recipe.image} style={styles.image} />
        </View>
      )} */}
      <Text style={styles.title}>{recipe.name}</Text>
      {/* <Text style={styles.description}>{recipe.description}</Text> */}

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Prep Time</Text>
          <Text style={styles.statValue}>{recipe.estimatedTime} min</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Est. Cost</Text>
          <Text style={styles.statValue}>${recipe.estimatedPrice}</Text>
        </View>
      </View>

      {/* {recipe.categories && recipe.categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {recipe.categories.map((cat, i) => (
              <View key={i} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
      )} */}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {Object.entries(recipe.ingredients).map(([name, amount], i) => (
          <View key={i} style={styles.ingredientRow}>
            <Text style={styles.ingredientName}>• {name}</Text>
            <Text style={styles.ingredientAmount}>{amount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {(recipe.steps || []).map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{i + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  content: {
    paddingBottom: 24,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
  },
  title: {
    fontWeight: "900",
    fontSize: 32,
    color: "#1a1a1a",
    marginVertical: 12,
    marginHorizontal: 24,
  },
  imageParent: {
    width: "100%",
    maxHeight: 240,
    display: "flex",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    marginTop: 12,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  categoriesSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  categoryTag: {
    backgroundColor: "#f2f6fb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  sectionContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  ingredientName: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 15,
    color: "#999",
    fontWeight: "500",
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumber: {
    fontWeight: "700",
    fontSize: 16,
    color: "#007AFF",
    marginRight: 12,
    minWidth: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
});
