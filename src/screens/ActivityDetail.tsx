import React, { useLayoutEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getActivityById } from "../data/activities";
import type { AppScreenProps } from "../types/navigation";

function formatMoney(cost: number) {
  return cost <= 0 ? "Free" : `$${cost}`;
}

function formatTimeWindow(startHour12: string, startPeriod: string, endHour12: string, endPeriod: string) {
  return `${startHour12} ${startPeriod} - ${endHour12} ${endPeriod}`;
}

export default function ActivityDetail({ route, navigation }: AppScreenProps<"ActivityDetail">) {
  const { id } = route.params || {};
  const activity = getActivityById(id);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackTitle: "Back",
      title: activity.name || "Activity",
    });
  }, [navigation]);

  if (!activity) {
    return (
      <View style={styles.missingContainer}>
        <Text>Activity not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{activity.name}</Text>
      <Text style={styles.description}>{activity.description}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Cost</Text>
          <Text style={styles.statValue}>{formatMoney(activity.cost)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>
            {activity.durationMinutes.min}-{activity.durationMinutes.max} min
          </Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.tagContainer}>
          {activity.categories.map((category) => (
            <View key={category} style={styles.tag}>
              <Text style={styles.tagText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Best Days</Text>
        <Text style={styles.bodyText}>
          {activity.bestDaysOfWeek.join(", ")}
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Best Months</Text>
        <Text style={styles.bodyText}>
          {activity.bestMonthsOfYear.join(", ")}
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Best Times</Text>
        {activity.bestTimesOfDay.map((timeWindow, index) => (
          <View key={index} style={styles.timeRow}>
            <Text style={styles.bodyText}>
              {formatTimeWindow(
                timeWindow.startHour12,
                timeWindow.startPeriod,
                timeWindow.endHour12,
                timeWindow.endPeriod,
              )}
            </Text>
          </View>
        ))}
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  missingContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fafbfc",
  },
  title: {
    fontWeight: "900",
    fontSize: 32,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
  tagContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#f2f6fb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  timeRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
});
