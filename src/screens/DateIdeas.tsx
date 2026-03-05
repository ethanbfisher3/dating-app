import React from "react"
import { View, Text, FlatList, StyleSheet } from "react-native"
import dateideas from "../data/DateIdeas"
import DateIdeaBox from "../Components/DateIdeaBox"

export default function DateIdeasScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Date Ideas</Text>
      </View>
      <FlatList
        data={dateideas}
        keyExtractor={(item) => String(item.name)}
        renderItem={({ item }) => (
          <DateIdeaBox
            idea={item}
            onPressInspect={(idea) =>
              navigation.navigate("InspectDateIdea", { id: idea.id })
            }
            navigation={navigation}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fafbfc" },
  item: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  image: { width: 80, height: 60, marginRight: 10, borderRadius: 6 },
  name: { fontWeight: "700" },
  desc: { color: "#444" },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontWeight: "900",
    fontSize: 36,
    marginVertical: 0,
    color: "#1a1a1a",
  },
})
