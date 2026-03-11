import React from "react"
import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import type { AppNavigation } from "../types/navigation"

export default function Pages({ navigation }: { navigation: AppNavigation }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
        Pages
      </Text>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("DateIdeas")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Date Ideas</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("PlanADate")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Plan a Date</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("RecipesPage")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("Clubs")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Clubs</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("EventsPage")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Events</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("Tips")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Tips</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => navigation.navigate("Contact")}
      >
        <Text style={{ color: "#007AFF", fontSize: 16 }}>Contact</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
