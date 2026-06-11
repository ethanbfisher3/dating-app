import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Text from "./AppText";
import { getRecordedDates, initializeRecordedDates, subscribeRecordedDates } from "../data/dateHistoryStore";
import { getSavedIdeas, subscribeSavedIdeas } from "../data/savedIdeasStore";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

type CalendarWidgetProps = {
  onDayPress?: (dateKey: string) => void;
};

export default function CalendarWidget({ onDayPress }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [recordedDateKeys, setRecordedDateKeys] = useState<string[]>([]);
  const [savedIdeaDateKeys, setSavedIdeaDateKeys] = useState<string[]>([]);

  const todayKey = toDateKey(new Date());

  useEffect(() => {
    let isMounted = true;
    const load = () => {
      if (!isMounted) return;
      const recorded = getRecordedDates().filter((e) => isValidDateKey(e.dateOfDate));
      const saved = getSavedIdeas().filter((e) => e.selectedDate && isValidDateKey(e.selectedDate));
      setRecordedDateKeys(recorded.map((e) => e.dateOfDate));
      setSavedIdeaDateKeys(saved.map((e) => e.selectedDate as string));
    };
    void initializeRecordedDates().then(load);
    const unsubRecorded = subscribeRecordedDates(load);
    const unsubSaved = subscribeSavedIdeas(load);
    return () => {
      isMounted = false;
      unsubRecorded();
      unsubSaved();
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, { past: number; future: number }>();
    const increment = (dateKey: string, isFuture: boolean) => {
      const current = map.get(dateKey) ?? { past: 0, future: 0 };
      if (isFuture) current.future += 1;
      else current.past += 1;
      map.set(dateKey, current);
    };
    recordedDateKeys.forEach((k) => increment(k, k >= todayKey));
    savedIdeaDateKeys.forEach((k) => increment(k, k >= todayKey));
    return map;
  }, [savedIdeaDateKeys, recordedDateKeys, todayKey]);

  const monthStart = startOfMonth(currentMonth);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const totalPast = Array.from(eventsByDate.values()).reduce((s, e) => s + e.past, 0);
  const totalFuture = Array.from(eventsByDate.values()).reduce((s, e) => s + e.future, 0);

  return (
    <View>
      {/* Calendar card */}
      <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", padding: 14, marginBottom: 14 }}>
        {/* Month nav */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => setCurrentMonth((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: "#1d4ed8" }}>Prev</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, color: "#1f2d3d" }}>{monthLabel(currentMonth)}</Text>
          <TouchableOpacity
            onPress={() => setCurrentMonth((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: "#1d4ed8" }}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <View key={day} style={{ width: "14.285%", alignItems: "center" }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Day grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((dayNumber, index) => {
            if (dayNumber === null) {
              return <View key={`empty_${index}`} style={{ width: "14.285%", padding: 4 }} />;
            }
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
            const stats = eventsByDate.get(dateKey);
            const hasPast = Boolean(stats?.past);
            const hasFuture = Boolean(stats?.future);
            const isToday = dateKey === todayKey;
            const hasEntries = hasPast || hasFuture;
            return (
              <View key={dateKey} style={{ width: "14.285%", padding: 4 }}>
                <TouchableOpacity
                  onPress={() => onDayPress?.(dateKey)}
                  disabled={!hasEntries || !onDayPress}
                  activeOpacity={0.75}
                  style={{
                    minHeight: 54,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isToday ? "#1e90ff" : "#dce6ef",
                    backgroundColor: isToday ? "#eff6ff" : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: hasEntries ? 1 : 0.72,
                  }}
                >
                  <Text style={{ color: "#1f2d3d" }}>{dayNumber}</Text>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 4 }}>
                    {hasPast ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#ef4444" }} /> : null}
                    {hasFuture ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" }} /> : null}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dce6ef", padding: 14, marginBottom: 14 }}>
        <Text style={{ fontSize: 15, color: "#1f2d3d", marginBottom: 8 }}>Legend</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginRight: 8 }} />
          <Text style={{ color: "#4b5b6b" }}>Past dates</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginRight: 8 }} />
          <Text style={{ color: "#4b5b6b" }}>Future dates</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#dce6ef", borderRadius: 12, padding: 14 }}>
        <Text style={{ color: "#1f2d3d", fontSize: 15, marginBottom: 4 }}>Summary</Text>
        <Text style={{ color: "#4b5b6b", marginBottom: 2 }}>Past entries: {totalPast}</Text>
        <Text style={{ color: "#4b5b6b" }}>Future entries: {totalFuture}</Text>
      </View>
    </View>
  );
}
