import React from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DATE_CATEGORIES } from "../utils/utils";

type PlanDateInputsModalProps = {
  visible: boolean;
  showDatePicker: boolean;
  selectedDate: Date | null;
  maxPrice: string;
  startHour12: string;
  startPeriod: "AM" | "PM";
  endHour12: string;
  endPeriod: "AM" | "PM";
  dateLengthHours: string;
  dateLengthMinutes: string;
  maxDistance: string;
  categoriesChecked: boolean[];
  selectedCategoriesCount: number;
  isGeneratingIdeas: boolean;
  serverTarget: string;
  onClose: () => void;
  onShowDatePicker: () => void;
  onHideDatePicker: () => void;
  onDateChange: (value: Date) => void;
  onChangeMaxPrice: (value: string) => void;
  onChangeStartHour12: (value: string) => void;
  onChangeEndHour12: (value: string) => void;
  onSetStartPeriod: (value: "AM" | "PM") => void;
  onSetEndPeriod: (value: "AM" | "PM") => void;
  onChangeDateLengthHours: (value: string) => void;
  onChangeDateLengthMinutes: (value: string) => void;
  onChangeMaxDistance: (value: string) => void;
  onToggleCategory: (index: number) => void;
  onSubmit: () => void;
};

export default function PlanDateInputsModal({
  visible,
  showDatePicker,
  selectedDate,
  maxPrice,
  startHour12,
  startPeriod,
  endHour12,
  endPeriod,
  dateLengthHours,
  dateLengthMinutes,
  maxDistance,
  categoriesChecked,
  selectedCategoriesCount,
  isGeneratingIdeas,
  serverTarget,
  onClose,
  onShowDatePicker,
  onHideDatePicker,
  onDateChange,
  onChangeMaxPrice,
  onChangeStartHour12,
  onChangeEndHour12,
  onSetStartPeriod,
  onSetEndPeriod,
  onChangeDateLengthHours,
  onChangeDateLengthMinutes,
  onChangeMaxDistance,
  onToggleCategory,
  onSubmit,
}: PlanDateInputsModalProps) {
  const handleDateChange = (event: any, value?: Date) => {
    if (Platform.OS === "android") {
      onHideDatePicker();
    }

    const isConfirmed = Platform.OS === "ios" || event?.type === "set";
    if (isConfirmed && value) {
      onDateChange(value);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          padding: 20,
        }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#dce6ef",
            maxHeight: "88%",
            overflow: "hidden",
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#1f2d3d",
                marginBottom: 12,
              }}
            >
              Plan Date
            </Text>

            <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>Date</Text>
            <TouchableOpacity
              onPress={onShowDatePicker}
              style={{
                padding: 12,
                borderWidth: 2,
                borderColor: "#1e90ff",
                borderRadius: 10,
                marginBottom: 12,
                backgroundColor: "#fff",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: selectedDate ? "#1a1a1a" : "#9ca3af",
                }}
              >
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Select a date"}
              </Text>
            </TouchableOpacity>

            {showDatePicker ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#dfe5eb",
                  borderRadius: 10,
                  marginBottom: 12,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                }}
              >
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  onChange={handleDateChange}
                  themeVariant={Platform.OS === "ios" ? "light" : undefined}
                  {...(Platform.OS === "ios"
                    ? {
                        textColor: "#1a1a1a",
                        accentColor: "#007AFF",
                      }
                    : {})}
                />
                {Platform.OS === "ios" ? (
                  <TouchableOpacity
                    onPress={onHideDatePicker}
                    style={{
                      alignItems: "center",
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderTopColor: "#dfe5eb",
                    }}
                  >
                    <Text
                      style={{
                        color: "#007AFF",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <Text
              style={{
                marginBottom: 10,
                fontSize: 16,
                fontWeight: "600",
                color: "#2c3e50",
              }}
            >
              Time Window
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  Start Hour
                </Text>
                <TextInput
                  value={startHour12}
                  onChangeText={onChangeStartHour12}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ width: 96 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  AM/PM
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {(["AM", "PM"] as const).map((period) => (
                    <TouchableOpacity
                      key={`start-${period}`}
                      onPress={() => onSetStartPeriod(period)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: startPeriod === period ? "#1e90ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: startPeriod === period ? "#fff" : "#1f2d3d",
                        }}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  End Hour
                </Text>
                <TextInput
                  value={endHour12}
                  onChangeText={onChangeEndHour12}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ width: 96 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  AM/PM
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {(["AM", "PM"] as const).map((period) => (
                    <TouchableOpacity
                      key={`end-${period}`}
                      onPress={() => onSetEndPeriod(period)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: endPeriod === period ? "#1e90ff" : "#fff",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: endPeriod === period ? "#fff" : "#1f2d3d",
                        }}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Date Length</Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <TextInput
                    value={dateLengthHours}
                    onChangeText={onChangeDateLengthHours}
                    keyboardType="number-pad"
                    placeholder="Hours"
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                  <TextInput
                    value={dateLengthMinutes}
                    onChangeText={onChangeDateLengthMinutes}
                    keyboardType="number-pad"
                    placeholder="Minutes"
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#dce6ef",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Max Budget ($)</Text>
                <View
                  style={{
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#fff",
                  }}
                >
                  <TextInput
                    value={maxPrice}
                    onChangeText={onChangeMaxPrice}
                    keyboardType="number-pad"
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => onChangeMaxPrice("0")}
                    style={{
                      minWidth: 76,
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      alignItems: "center",
                      borderLeftWidth: 1,
                      borderLeftColor: "#dce6ef",
                      backgroundColor: maxPrice === "0" ? "#1e90ff" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: maxPrice === "0" ? "#fff" : "#1f2d3d",
                      }}
                    >
                      Free
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Max Distance (miles)</Text>
                <View
                  style={{
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: "#dce6ef",
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#fff",
                  }}
                >
                  <TextInput
                    value={maxDistance}
                    onChangeText={onChangeMaxDistance}
                    keyboardType="number-pad"
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => onChangeMaxDistance("0")}
                    style={{
                      minWidth: 92,
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      alignItems: "center",
                      borderLeftWidth: 1,
                      borderLeftColor: "#dce6ef",
                      backgroundColor: maxDistance === "0" ? "#1e90ff" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: maxDistance === "0" ? "#fff" : "#1f2d3d",
                      }}
                    >
                      At Home
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {__DEV__ ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#dce6ef",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 12,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ color: "#2c3e50", fontSize: 15, fontWeight: "700" }}>(DEV) Place Source</Text>
                <Text style={{ marginTop: 2, color: "#667788", fontSize: 13 }}>Overpass query API</Text>
              </View>
            ) : null}

            <Text
              style={{
                color: "#4b5b6b",
                marginBottom: 8,
                fontWeight: "700",
              }}
            >
              Categories ({selectedCategoriesCount} selected)
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {DATE_CATEGORIES.map((category, index) => {
                const checked = categoriesChecked[index];
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => onToggleCategory(index)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: checked ? "#1e90ff" : "#dce6ef",
                      backgroundColor: checked ? "#e8f3ff" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        color: checked ? "#1e90ff" : "#4b5b6b",
                        fontWeight: checked ? "700" : "500",
                      }}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#dce6ef",
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ color: "#3b4a5a", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onSubmit}
                disabled={isGeneratingIdeas}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: "#28a745",
                  opacity: isGeneratingIdeas ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{isGeneratingIdeas ? "Generate Date Ideas..." : "Generate"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
