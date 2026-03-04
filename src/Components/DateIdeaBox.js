import React from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native"
import WebsiteLink from "./WebsiteLink"
import { findDealsForName } from "../data/sscIndex"
import { sanitizeUri } from "../utils/imageUtils"

function getDistanceText(idea) {
  if (idea.distanceFromCampus) return `${idea.distanceFromCampus} mi`
  if (idea.locations && idea.locations.length) {
    const ds = idea.locations.map((l) => l.distanceFromCampus).filter(Boolean)
    if (!ds.length) return null
    const first = ds[0]
    return typeof first === "number" ? `${first} mi` : String(first)
  }
  return null
}

function getSeasonText(idea) {
  const months = idea.seasonalTimeframe?.months || idea.seasonalTimeframe
  if (!months || !months.length) return null
  if (months.length >= 11) return "All year"
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
  const rawImage =
    idea.imgSrc ||
    idea.image ||
    idea.img ||
    idea.photo ||
    idea.image_url ||
    null
  const imageUri = sanitizeUri(rawImage)
  const distanceText = getDistanceText(idea)
  const seasonText = getSeasonText(idea)
  const sscDeals = idea.CanUseSSC
    ? findDealsForName(idea.name || idea.title || "")
    : []

  return (
    <View style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : null}
      <View style={styles.body}>
        <View style={styles.rowTop}>
          <Text style={styles.title}>{idea.name || idea.title}</Text>
          <View style={styles.badges}>
            {idea.free ? (
              <Chip style={{ backgroundColor: "#e6ffef" }}>Free</Chip>
            ) : null}
            {idea.majorRizz ? (
              <Chip style={{ backgroundColor: "#fff4e6" }}>Major Rizz</Chip>
            ) : null}
            {idea.CanUseSSC ? (
              <Chip style={{ backgroundColor: "#eef6ff" }}>SSC</Chip>
            ) : null}
            {sscDeals && sscDeals.length ? (
              <Chip style={{ backgroundColor: "#eaf7ff" }}>
                {sscDeals.length} deal{sscDeals.length > 1 ? "s" : ""}
              </Chip>
            ) : null}
          </View>
        </View>

        {idea.subtitle ? (
          <Text style={styles.subtitle}>{idea.subtitle}</Text>
        ) : null}

        {idea.description ? (
          <Text style={styles.desc} numberOfLines={3}>
            {idea.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {distanceText ? (
            <Text style={styles.meta}>{distanceText}</Text>
          ) : null}
          {idea.pricing ? (
            <Text style={styles.meta}>{idea.pricing}</Text>
          ) : null}
          {seasonText ? <Text style={styles.meta}>{seasonText}</Text> : null}
        </View>

        <View style={styles.categoriesRow}>
          {(idea.categories || []).slice(0, 6).map((c, i) => (
            <Chip key={i} style={{ backgroundColor: "#f2f6fb" }}>
              {c}
            </Chip>
          ))}
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => onPressInspect?.(idea)}
          >
            <Text style={styles.buttonText}>Details</Text>
          </TouchableOpacity>
          {idea.website ? (
            <WebsiteLink href={idea.website}>Visit</WebsiteLink>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    backgroundColor: "#fff",
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  image: { width: "100%", height: 200, resizeMode: "cover" },
  body: { flex: 1, padding: 18 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
    marginRight: 8,
    color: "#1a1a1a",
  },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  subtitle: { color: "#666", marginTop: 6, fontSize: 16 },
  desc: { marginTop: 10, color: "#444", fontSize: 15, lineHeight: 22 },
  metaRow: { flexDirection: "row", marginTop: 10, gap: 12, flexWrap: "wrap" },
  meta: { color: "#666", fontSize: 14, marginRight: 8 },
  categoriesRow: {
    flexDirection: "row",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#1b1b1b" },
  rowActions: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
    gap: 12,
  },
  button: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
