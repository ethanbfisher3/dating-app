import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function Header({ navigation }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation?.navigate('Home')}>
        <Text style={styles.title}>BYUSINGLES</Text>
      </TouchableOpacity>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigation?.navigate('DateIdeas')}> 
          <Text style={styles.link}>Date Ideas</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate('PlanADate')}> 
          <Text style={styles.link}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation?.navigate('RecipesPage')}> 
          <Text style={styles.link}>Recipes</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
    backgroundColor: '#f3f6fb',
    borderBottomWidth: 1,
    borderColor: '#e6ecf3',
  },
  title: { fontSize: 20, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  link: { color: '#1e90ff' },
})
