import React from 'react'
import { View, Text, Button, ScrollView } from 'react-native'

export default function Pages({ navigation }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>Pages</Text>
      <Button title="Date Ideas" onPress={() => navigation.navigate('DateIdeas')} />
      <Button title="Plan a Date" onPress={() => navigation.navigate('PlanADate')} />
      <Button title="Recipes" onPress={() => navigation.navigate('RecipesPage')} />
      <Button title="Clubs" onPress={() => navigation.navigate('Clubs')} />
      <Button title="Events" onPress={() => navigation.navigate('EventsPage')} />
      <Button title="Tips" onPress={() => navigation.navigate('Tips')} />
      <Button title="Contact" onPress={() => navigation.navigate('Contact')} />
    </ScrollView>
  )
}
