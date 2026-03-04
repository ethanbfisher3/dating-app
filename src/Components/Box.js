import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'

export default function Box({ title, subtitle, image, children }) {
  return (
    <View style={styles.box}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <View style={styles.content}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View>{children}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
    elevation: 1,
  },
  image: { width: '100%', height: 160, resizeMode: 'cover' },
  content: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 8 },
})
