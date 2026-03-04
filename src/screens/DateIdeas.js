import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import dateideas from '../data/DateIdeas'
import DateIdeaBox from '../Components/DateIdeaBox'

export default function DateIdeasScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={dateideas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <DateIdeaBox
            idea={item}
            onPressInspect={(idea) => navigation.navigate('InspectDateIdea', { id: idea.id })}
            navigation={navigation}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  item: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  image: { width: 80, height: 60, marginRight: 10, borderRadius: 6 },
  name: { fontWeight: '700' },
  desc: { color: '#444' },
})
