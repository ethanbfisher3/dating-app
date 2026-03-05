import React from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native"
import type { AppNavigation } from "../types/navigation"

export default function Home({ navigation }: { navigation: AppNavigation }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingTop:36, backgroundColor: "#fafbfc" }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 42,
          marginVertical: 24,
          color: "#1a1a1a",
          letterSpacing: 0.5,
        }}
      >
        BYUSINGLES
      </Text>
      <Text
        style={{
          fontSize: 24,
          marginBottom: 16,
          fontWeight: "600",
          color: "#2c3e50",
        }}
      >
        Bringing You Unforgettable Sparks
      </Text>
      <Text
        style={{
          marginBottom: 32,
          fontSize: 17,
          lineHeight: 24,
          color: "#555",
        }}
      >
        Are you a student in Provo, Utah struggling to think of good date ideas?
        We're here to help.
      </Text>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("DateIdeas")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Date Ideas
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("Date Planner")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Plan a Date
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("RecipesPage")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Recipes
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("Clubs")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Clubs
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("EventsPage")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Events
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("Tips")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Tips
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          marginVertical: 12,
          backgroundColor: "#1e90ff",
          paddingVertical: 18,
          paddingHorizontal: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("Contact")}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Contact
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
