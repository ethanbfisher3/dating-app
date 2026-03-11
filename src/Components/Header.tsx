import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import type { AppNavigation } from "../types/navigation"
import appInfo from "src/data/info"

export default function Header({ navigation }: { navigation?: AppNavigation }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.navigate("Home")}>
        <Text style={styles.title}>{appInfo.appName}</Text>
      </TouchableOpacity>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigation?.navigate("DateIdeas")}>
          <Text style={styles.link}>Date Ideas</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate("PlanADate")}>
          <Text style={styles.link}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate("RecipesPage")}>
          <Text style={styles.link}>Recipes</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: "#f3f6fb",
    borderBottomWidth: 2,
    borderColor: "#d0dde8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  navRow: { flexDirection: "row", gap: 24, marginTop: 14 },
  link: { color: "#1e90ff", fontSize: 18, fontWeight: "600" },
})
