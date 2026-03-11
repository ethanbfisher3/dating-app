import React from "react"
import { View, StyleSheet } from "react-native"
import Header from "./Header"
import Footer from "./Footer"
import type { AppNavigation } from "../types/navigation"

export default function Layout({
  children,
  navigation,
}: {
  children: React.ReactNode
  navigation?: AppNavigation
}) {
  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <View style={styles.content}>{children}</View>
      <Footer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafbfc" },
  content: { flex: 1 },
})
