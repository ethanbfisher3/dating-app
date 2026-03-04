import React from "react"
import { View, Text, Image, StyleSheet } from "react-native"

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
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  image: { width: "100%", height: 220, resizeMode: "cover" },
  content: { padding: 18 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 6, color: "#1a1a1a" },
  subtitle: { color: "#666", marginBottom: 12, fontSize: 16 },
})
