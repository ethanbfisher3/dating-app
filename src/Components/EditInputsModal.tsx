import React, { useRef, useState } from "react";
import { Modal, KeyboardAvoidingView, Platform, View, ScrollView, TouchableOpacity, Pressable } from "react-native";
import Text from "./AppText";
import TextInput from "./AppTextInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { ScrollView as ScrollViewType } from "react-native";
import { DATE_CATEGORIES } from "../utils/utils";

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  editModalScrollRef: React.RefObject<ScrollViewType>;
  showEditDatePicker: boolean;
  setShowEditDatePicker: (v: boolean) => void;
  draftSelectedDate: string;
  setDraftSelectedDate: (d: string) => void;
  draftDateValue: Date;
  draftStartHour12: string;
  setDraftStartHour12: (s: string) => void;
  draftStartPeriod: "AM" | "PM";
  setDraftStartPeriod: (p: "AM" | "PM") => void;
  draftEndHour12: string;
  setDraftEndHour12: (s: string) => void;
  draftEndPeriod: "AM" | "PM";
  setDraftEndPeriod: (p: "AM" | "PM") => void;
  draftDateLengthHours: string;
  setDraftDateLengthHours: (s: string) => void;
  draftDateLengthMinutes: string;
  setDraftDateLengthMinutes: (s: string) => void;
  draftMaxPrice: string;
  setDraftMaxPrice: (s: string) => void;
  draftMaxDistance: string;
  setDraftMaxDistance: (s: string) => void;
  draftCategoriesChecked: boolean[];
  toggleDraftCategory: (i: number) => void;
  editError: string | null;
  applyEditsAndRegenerate: () => void;
  handleEditInputFocus: (event: any) => void;
};

export default function EditInputsModal(props: Props) {
  const {
    visible,
    onRequestClose,
    editModalScrollRef,
    showEditDatePicker,
    setShowEditDatePicker,
    draftSelectedDate,
    setDraftSelectedDate,
    draftDateValue,
    draftStartHour12,
    setDraftStartHour12,
    draftStartPeriod,
    setDraftStartPeriod,
    draftEndHour12,
    setDraftEndHour12,
    draftEndPeriod,
    setDraftEndPeriod,
    draftDateLengthHours,
    setDraftDateLengthHours,
    draftDateLengthMinutes,
    setDraftDateLengthMinutes,
    draftMaxPrice,
    setDraftMaxPrice,
    draftMaxDistance,
    setDraftMaxDistance,
    draftCategoriesChecked,
    toggleDraftCategory,
    editError,
    applyEditsAndRegenerate,
    handleEditInputFocus,
  } = props;

  const [infoPopup, setInfoPopup] = useState<{ visible: boolean; text: string }>({ visible: false, text: "" });
  const lastNonZeroBudgetRef = useRef<string>(draftMaxPrice === "0" ? "20" : draftMaxPrice);
  const lastNonZeroDistanceRef = useRef<string>(draftMaxDistance === "0" ? "5" : draftMaxDistance);
  const showInfo = (text: string) => setInfoPopup({ visible: true, text });
  const closeInfo = () => setInfoPopup({ visible: false, text: "" });

  const handleBudgetChange = (value: string) => {
    setDraftMaxPrice(value);
    if (value.trim() !== "" && value.trim() !== "0") {
      lastNonZeroBudgetRef.current = value;
    }
  };

  const handleBudgetPresetToggle = () => {
    const trimmed = draftMaxPrice.trim();
    if (trimmed === "0" || trimmed === "") {
      setDraftMaxPrice(lastNonZeroBudgetRef.current || "20");
      return;
    }

    lastNonZeroBudgetRef.current = draftMaxPrice;
    setDraftMaxPrice("0");
  };

  const handleDistanceChange = (value: string) => {
    setDraftMaxDistance(value);
    if (value.trim() !== "" && value.trim() !== "0") {
      lastNonZeroDistanceRef.current = value;
    }
  };

  const handleDistancePresetToggle = () => {
    const trimmed = draftMaxDistance.trim();
    if (trimmed === "0" || trimmed === "") {
      setDraftMaxDistance(lastNonZeroDistanceRef.current || "5");
      return;
    }

    lastNonZeroDistanceRef.current = draftMaxDistance;
    setDraftMaxDistance("0");
  };

  function InfoBubble({ onPress }: { onPress: () => void }) {
    return (
      <Pressable onPress={onPress} style={{ marginLeft: 8, justifyContent: "center", alignItems: "center" }} hitSlop={8}>
        <View
          style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#1e90ff", justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>i</Text>
        </View>
      </Pressable>
    );
  }

  function InfoPopup({ visible, text, onClose }: { visible: boolean; text: string; onClose: () => void }) {
    if (!visible) return null;
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.18)", justifyContent: "center", alignItems: "center" }}
          onPress={onClose}
        >
          <View style={{ backgroundColor: "#fff", padding: 16, borderRadius: 12, maxWidth: 320, borderWidth: 1, borderColor: "#dce6ef" }}>
            <Text style={{ color: "#1f2d3d", fontSize: 15, marginBottom: 8 }}>Info</Text>
            <Text style={{ color: "#3b4a5a", fontSize: 14 }}>{text}</Text>
          </View>
        </Pressable>
      </Modal>
    );
  }

  function PresetSlider({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          flex: 1,
          height: "100%",
          paddingHorizontal: 14,
          justifyContent: "center",
          backgroundColor: active ? "#1e90ff" : "#fff",
        }}
      >
        <Text style={{ color: active ? "#fff" : "#1f2d3d" }}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20 }}
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
            ref={editModalScrollRef}
            showsVerticalScrollIndicator
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <Text style={{ fontSize: 18, color: "#1f2d3d", marginBottom: 12 }}>Edit Inputs</Text>

            <Text style={{ color: "#4b5b6b", marginBottom: 4 }}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowEditDatePicker(true)}
              style={{ padding: 12, borderWidth: 2, borderColor: "#1e90ff", borderRadius: 10, marginBottom: 12, backgroundColor: "#fff" }}
            >
              <Text style={{ fontSize: 16, color: "#1a1a1a" }}>{draftSelectedDate}</Text>
            </TouchableOpacity>

            {showEditDatePicker ? (
              <DateTimePicker
                value={draftDateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, value) => {
                  if (Platform.OS !== "ios") {
                    setShowEditDatePicker(false);
                  }

                  if (!value) {
                    return;
                  }

                  const year = value.getFullYear();
                  const month = String(value.getMonth() + 1).padStart(2, "0");
                  const day = String(value.getDate()).padStart(2, "0");
                  setDraftSelectedDate(`${year}-${month}-${day}`);
                }}
              />
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: "#2c3e50" }}>Time Window</Text>
              <InfoBubble onPress={() => showInfo("The time you are available to go out on this date")} />
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>Start Hour</Text>
                <TextInput
                  value={draftStartHour12}
                  onChangeText={setDraftStartHour12}
                  keyboardType="number-pad"
                  onFocus={handleEditInputFocus}
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
                <Text style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>AM/PM</Text>
                <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#dce6ef", borderRadius: 10, overflow: "hidden" }}>
                  {(["AM", "PM"] as const).map((period) => (
                    <TouchableOpacity
                      key={`start-${period}`}
                      onPress={() => setDraftStartPeriod(period)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: draftStartPeriod === period ? "#1e90ff" : "#fff",
                      }}
                    >
                      <Text style={{ color: draftStartPeriod === period ? "#fff" : "#1f2d3d" }}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>End Hour</Text>
                <TextInput
                  value={draftEndHour12}
                  onChangeText={setDraftEndHour12}
                  keyboardType="number-pad"
                  onFocus={handleEditInputFocus}
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
                <Text style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>AM/PM</Text>
                <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#dce6ef", borderRadius: 10, overflow: "hidden" }}>
                  {(["AM", "PM"] as const).map((period) => (
                    <TouchableOpacity
                      key={`end-${period}`}
                      onPress={() => setDraftEndPeriod(period)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: draftEndPeriod === period ? "#1e90ff" : "#fff",
                      }}
                    >
                      <Text style={{ color: draftEndPeriod === period ? "#fff" : "#1f2d3d" }}>{period}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ color: "#4b5b6b" }}>Date Length</Text>
                  <InfoBubble
                    onPress={() =>
                      showInfo("The Maximum time the date will last. Must be less than or equal to the time between Start and End times.")
                    }
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: "#667788", marginBottom: 4 }}>Hours</Text>
                    <TextInput
                      value={draftDateLengthHours}
                      onChangeText={setDraftDateLengthHours}
                      keyboardType="number-pad"
                      placeholder="0"
                      onFocus={handleEditInputFocus}
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
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: "#667788", marginBottom: 4 }}>Minutes</Text>
                    <TextInput
                      value={draftDateLengthMinutes}
                      onChangeText={setDraftDateLengthMinutes}
                      keyboardType="number-pad"
                      placeholder="0"
                      onFocus={handleEditInputFocus}
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
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Max Budget ($)</Text>
                <View style={{ flexDirection: "row", alignItems: "stretch", gap: 8 }}>
                  <TextInput
                    value={draftMaxPrice}
                    onChangeText={handleBudgetChange}
                    keyboardType="number-pad"
                    onFocus={handleEditInputFocus}
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
                  <View style={{ borderWidth: 1, borderColor: "#dce6ef", borderRadius: 10, overflow: "hidden", justifyContent: "center" }}>
                    <PresetSlider label="Free" active={draftMaxPrice.trim() === "0"} onPress={handleBudgetPresetToggle} />
                  </View>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#4b5b6b", marginBottom: 6 }}>Max Distance (miles)</Text>
                <View style={{ flexDirection: "row", alignItems: "stretch", gap: 8 }}>
                  <TextInput
                    value={draftMaxDistance}
                    onChangeText={handleDistanceChange}
                    keyboardType="number-pad"
                    onFocus={handleEditInputFocus}
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
                  <View style={{ borderWidth: 1, borderColor: "#dce6ef", borderRadius: 10, overflow: "hidden", justifyContent: "center" }}>
                    <PresetSlider label="At Home" active={draftMaxDistance.trim() === "0"} onPress={handleDistancePresetToggle} />
                  </View>
                </View>
              </View>
            </View>

            <Text style={{ color: "#4b5b6b", marginBottom: 8 }}>Categories</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {DATE_CATEGORIES.map((category, index) => {
                const checked = draftCategoriesChecked[index];
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => toggleDraftCategory(index)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: checked ? "#1e90ff" : "#dce6ef",
                      backgroundColor: checked ? "#e8f3ff" : "#fff",
                    }}
                  >
                    <Text style={{ color: checked ? "#1e90ff" : "#4b5b6b" }}>{category}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <InfoPopup visible={infoPopup.visible} text={infoPopup.text} onClose={closeInfo} />
            {editError ? <Text style={{ color: "#b42318", marginBottom: 10 }}>{editError}</Text> : null}

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
              <TouchableOpacity
                onPress={onRequestClose}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#dce6ef",
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ color: "#3b4a5a" }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyEditsAndRegenerate}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1e90ff" }}
              >
                <Text style={{ color: "#fff" }}>Apply & Regenerate</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
