import React from "react"
import { View, StyleSheet } from "react-native"
import Header from "./Header"
import Footer from "./Footer"

export default function Layout({ children, navigation }) {
  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <View style={styles.content}>{children}</View>
      <Footer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  content: { padding: 12, paddingBottom: 32 },
})
