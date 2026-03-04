import React from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native"

export default function Home({ navigation }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontWeight: "bold", fontSize: 28, marginVertical: 20 }}>
        BYUSINGLES
      </Text>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Bringing You Unforgettable Sparks
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Are you a student in Provo, Utah struggling to think of good date ideas?
        We're here to help.
      </Text>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("DateIdeas")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Date Ideas</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("PlanADate")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Plan a Date</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("RecipesPage")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("Clubs")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Clubs</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("EventsPage")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Events</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("Tips")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Tips</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginVertical: 10 }}
        onPress={() => navigation.navigate("Contact")}
      >
        <Text style={{ color: "#007AFF", fontSize: 18 }}>Contact</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
