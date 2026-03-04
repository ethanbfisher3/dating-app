import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>BYU Dating — ideas, recipes, and events for BYU students.</Text>
      <Text style={styles.small}>Built with ❤️ · Expo</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  text: { color: '#444' },
  small: { color: '#888', fontSize: 12, marginTop: 6 }
})
