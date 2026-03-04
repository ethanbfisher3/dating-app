import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import WebsiteLink from './WebsiteLink'
import { findDealsForName } from '../data/sscIndex'
import { sanitizeUri } from '../utils/imageUtils'

function getDistanceText(idea) {
  if (idea.distanceFromCampus) return `${idea.distanceFromCampus} mi`
  if (idea.locations && idea.locations.length) {
    const ds = idea.locations.map((l) => l.distanceFromCampus).filter(Boolean)
    if (!ds.length) return null
    const first = ds[0]
    return typeof first === 'number' ? `${first} mi` : String(first)
  }
  return null
}

function getSeasonText(idea) {
  const months = idea.seasonalTimeframe?.months || idea.seasonalTimeframe
  if (!months || !months.length) return null
  if (months.length >= 11) return 'All year'
  const first = months[0]
  const last = months[months.length - 1]
  return first === last ? first : `${first}–${last}`
}

function Chip({ children, style }) {
  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  )
}

export default function DateIdeaBox({ idea, onPressInspect, navigation }) {
  if (!idea) return null
  const rawImage = idea.imgSrc || idea.image || idea.img || idea.photo || idea.image_url || null
  const imageUri = sanitizeUri(rawImage)
  const distanceText = getDistanceText(idea)
  const seasonText = getSeasonText(idea)
  const sscDeals = idea.CanUseSSC ? findDealsForName(idea.name || idea.title || '') : []

  return (
    <View style={styles.container}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : null}
      <View style={styles.body}>
        <View style={styles.rowTop}>
          <Text style={styles.title}>{idea.name || idea.title}</Text>
          <View style={styles.badges}>
            {idea.free ? <Chip style={{ backgroundColor: '#e6ffef' }}>Free</Chip> : null}
            {idea.majorRizz ? <Chip style={{ backgroundColor: '#fff4e6' }}>Major Rizz</Chip> : null}
            {idea.CanUseSSC ? <Chip style={{ backgroundColor: '#eef6ff' }}>SSC</Chip> : null}
            {sscDeals && sscDeals.length ? <Chip style={{ backgroundColor: '#eaf7ff' }}>{sscDeals.length} deal{sscDeals.length>1?'s':''}</Chip> : null}
          </View>
        </View>

        {idea.subtitle ? <Text style={styles.subtitle}>{idea.subtitle}</Text> : null}

        {idea.description ? <Text style={styles.desc} numberOfLines={3}>{idea.description}</Text> : null}

        <View style={styles.metaRow}>
          {distanceText ? <Text style={styles.meta}>{distanceText}</Text> : null}
          {idea.pricing ? <Text style={styles.meta}>{idea.pricing}</Text> : null}
          {seasonText ? <Text style={styles.meta}>{seasonText}</Text> : null}
        </View>

        <View style={styles.categoriesRow}>
          {(idea.categories || []).slice(0, 6).map((c, i) => (
            <Chip key={i} style={{ backgroundColor: '#f2f6fb' }}>{c}</Chip>
          ))}
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.button} onPress={() => onPressInspect?.(idea)}>
            <Text style={styles.buttonText}>Details</Text>
          </TouchableOpacity>
          {idea.website ? (
            <WebsiteLink href={idea.website}>
              Visit
            </WebsiteLink>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#fff', marginVertical: 8, borderRadius: 8, overflow: 'hidden', elevation: 1 },
  image: { width: 120, height: 120, resizeMode: 'cover' },
  body: { flex: 1, padding: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  badges: { flexDirection: 'row', gap: 6 },
  subtitle: { color: '#666', marginTop: 4 },
  desc: { marginTop: 8, color: '#444' },
  metaRow: { flexDirection: 'row', marginTop: 8, gap: 10, flexWrap: 'wrap' },
  meta: { color: '#666', fontSize: 12, marginRight: 8 },
  categoriesRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, marginRight: 6, marginBottom: 6 },
  chipText: { fontSize: 12, color: '#1b1b1b' },
  rowActions: { flexDirection: 'row', marginTop: 10, alignItems: 'center', gap: 12 },
  button: { backgroundColor: '#1e90ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: '600' }
})
