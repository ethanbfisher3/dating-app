import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'

export default function Home({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BYUSINGLES</Text>
      <Text style={styles.tagline}>Bringing You Unforgettable Sparks</Text>
      <Text style={styles.paragraph}>
        Are you a student in Provo, Utah struggling to think of good date ideas?
        We're here to help.
      </Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('DateIdeas')}
        >
          <Text style={styles.buttonText}>Date Ideas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('PlanADate')}
        >
          <Text style={styles.buttonText}>Plan a Date</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('RecipesPage')}
        >
          <Text style={styles.buttonText}>Recipes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.buttonAlt}
          onPress={() => navigation.navigate('EventsPage')}
        >
          <Text style={styles.buttonText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonAlt}
          onPress={() => navigation.navigate('Clubs')}
        >
          <Text style={styles.buttonText}>Clubs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonAlt}
          onPress={() => navigation.navigate('Tips')}
        >
          <Text style={styles.buttonText}>Tips</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 20 },
  tagline: { fontSize: 14, fontStyle: 'italic', marginVertical: 10 },
  paragraph: { textAlign: 'center', marginVertical: 10 },
  row: { flexDirection: 'row', marginTop: 10, gap: 10 },
  button: {
    backgroundColor: '#2b6cb0',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonAlt: {
    backgroundColor: '#4a5568',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600' },
})
