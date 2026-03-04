import React from 'react'
import { View, Text, Image, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native'
import { getDateIdeaById } from '../data/DateIdeas'
import { findDealsForName } from '../data/sscIndex'
import { sanitizeUri } from '../utils/imageUtils'

export default function InspectDateIdea({ route }) {
  const { id } = route.params || {}
  const idea = getDateIdeaById(id)
  if (!idea) return (
    <View style={{padding:20}}><Text>Not found</Text></View>
  )
  const imageUri = sanitizeUri(idea.imgSrc || idea.image || idea.img || idea.photo || idea.image_url)
  const sscDeals = idea.CanUseSSC ? findDealsForName(idea.name || idea.title || '') : []

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}
      <Text style={styles.title}>{idea.name}</Text>
      <Text style={styles.description}>{idea.description}</Text>
      {idea.website ? (
        <TouchableOpacity onPress={() => Linking.openURL(idea.website)}>
          <Text style={styles.link}>Open website</Text>
        </TouchableOpacity>
      ) : null}
      {idea.locations ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '700' }}>Locations</Text>
          {idea.locations.map((l, i) => (
            <TouchableOpacity key={i} onPress={() => l.src && Linking.openURL(l.src)}>
              <Text style={styles.location}>{l.name} {l.distanceFromCampus ? `· ${l.distanceFromCampus}` : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {sscDeals && sscDeals.length ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '700' }}>SSC Deals</Text>
          {sscDeals.map((d, i) => (
            <View key={i} style={{ marginTop: 8, padding: 8, backgroundColor: '#f7fbff', borderRadius: 8 }}>
              <Text style={{ fontWeight: '700' }}>{d.name}</Text>
              {d.deal ? <Text style={{ color: '#333', marginTop: 4 }}>{d.deal}</Text> : null}
              {d.image ? <Image source={{ uri: d.image }} style={{ width: 120, height: 60, marginTop: 8 }} /> : null}
              <TouchableOpacity
                style={{ marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1e90ff', borderRadius: 6, alignSelf: 'flex-start' }}
                onPress={() => {
                  const q = encodeURIComponent(`${d.name} starving student card deal`)
                  const url = `https://www.google.com/search?q=${q}`
                  Linking.openURL(url).catch(() => {})
                }}
              >
                <Text style={{ color: '#fff' }}>Open deal</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  image: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 16, color: '#333' },
  link: { color: '#1e90ff', marginTop: 12 },
  location: { color: '#444', marginTop: 6 },
})
