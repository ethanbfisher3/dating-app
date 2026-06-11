import React, { useLayoutEffect } from "react";
import { View, ScrollView, Image, StyleSheet } from "react-native";
import Text from "../Components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { getRecipeByIndex } from "../data/Recipes";
import { resolveRecipeImage } from "../data/recipeImageResolver";
import type { AppScreenProps } from "../types/navigation";

export default function RecipeDetail({ route, navigation }: AppScreenProps<"RecipeDetail">) {
  const { index } = route.params || {};
  const recipe = getRecipeByIndex(index);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
      title: recipe?.name ?? "Recipe",
    });
  }, [navigation]);

  if (!recipe) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#6b7280" }}>Recipe not found.</Text>
      </View>
    );
  }

  const imageSource = resolveRecipeImage(recipe.image);
  const ingredients = Object.entries(recipe.ingredients);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero image */}
      <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />

      <View style={styles.body}>
        {/* Title + description */}
        <Text style={styles.title}>{recipe.name}</Text>
        {recipe.description ? (
          <Text style={styles.description}>{recipe.description}</Text>
        ) : null}

        {/* Category pills */}
        {recipe.categories?.length > 0 ? (
          <View style={styles.pillRow}>
            {recipe.categories.map((cat, i) => (
              <View key={i} style={styles.pill}>
                <Text style={styles.pillText}>{cat}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#1e90ff" />
            <Text style={styles.statValue}>{recipe.estimatedTime} min</Text>
            <Text style={styles.statLabel}>Prep Time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color="#2e9f5b" />
            <Text style={styles.statValue}>${recipe.estimatedPrice}</Text>
            <Text style={styles.statLabel}>Est. Cost</Text>
          </View>
        </View>

        {/* Ingredients */}
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.ingredientCard}>
          {ingredients.map(([name, amount], i) => (
            <View
              key={i}
              style={[
                styles.ingredientRow,
                i < ingredients.length - 1 && styles.ingredientRowBorder,
              ]}
            >
              <Text style={styles.ingredientName}>{name}</Text>
              <Text style={styles.ingredientAmount}>{amount as string}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.stepsContainer}>
          {(recipe.steps || []).map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingBottom: 40,
  },

  heroImage: {
    width: "100%",
    height: 230,
    backgroundColor: "#e8edf3",
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 28,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 16,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: "#eff6ff",
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  pillText: {
    fontSize: 13,
    color: "#1e90ff",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8edf3",
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    color: "#1a1a1a",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9aa3af",
  },

  sectionTitle: {
    fontSize: 20,
    color: "#1a1a1a",
    marginBottom: 12,
  },

  ingredientCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8edf3",
    marginBottom: 28,
    overflow: "hidden",
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  ingredientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4f8",
  },
  ingredientName: {
    fontSize: 15,
    color: "#1f2d3d",
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 12,
  },

  stepsContainer: {
    gap: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  stepBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1e90ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  stepBubbleText: {
    fontSize: 14,
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#2c3e50",
    paddingTop: 4,
  },
});
