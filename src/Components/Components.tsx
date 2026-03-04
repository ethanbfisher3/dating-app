import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export function SeeMoreButton({ onPress, label = 'See More' }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.txt}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1e90ff',
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  txt: { color: '#fff', fontWeight: '600' }
})

export default { SeeMoreButton }
