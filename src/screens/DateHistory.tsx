import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import {
  addRecordedDate,
  getRecordedDates,
  removeRecordedDate,
  subscribeRecordedDates,
  updateRecordedDate,
  type RecordedDate,
} from "../data/dateHistoryStore"
import type { AppNavigation } from "../types/navigation"

export default function DateHistoryScreen({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const [recordedDates, setRecordedDates] = useState<RecordedDate[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)

  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [whatYouDid, setWhatYouDid] = useState("")
  const [moneySpent, setMoneySpent] = useState("")
  const [whatYouLiked, setWhatYouLiked] = useState("")
  const [whatYouLearned, setWhatYouLearned] = useState("")

  useEffect(() => {
    // Load initial data
    setRecordedDates(getRecordedDates())

    // Subscribe to changes
    const unsubscribe = subscribeRecordedDates(() => {
      setRecordedDates(getRecordedDates())
    })

    return unsubscribe
  }, [])

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date)
    }
    setShowDatePicker(false)
  }

  const resetForm = () => {
    setWhatYouDid("")
    setMoneySpent("")
    setWhatYouLiked("")
    setWhatYouLearned("")
    setSelectedDate(new Date())
    setShowDatePicker(false)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingDateId(null)
    resetForm()
  }

  const openCreateModal = () => {
    setEditingDateId(null)
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (date: RecordedDate) => {
    setEditingDateId(date.id)
    setSelectedDate(new Date(date.dateOfDate))
    setWhatYouDid(date.whatYouDid)
    setMoneySpent(String(date.moneySpent))
    setWhatYouLiked(date.whatYouLiked)
    setWhatYouLearned(date.whatYouLearned)
    setShowDatePicker(false)
    setModalVisible(true)
  }

  const handleSaveDate = () => {
    if (!whatYouDid.trim()) {
      Alert.alert("Error", "Please describe what you did on the date")
      return
    }

    if (!moneySpent.trim()) {
      Alert.alert("Error", "Please enter the amount spent")
      return
    }

    const moneyValue = parseFloat(moneySpent)
    if (isNaN(moneyValue)) {
      Alert.alert("Error", "Please enter a valid number for money spent")
      return
    }

    const datePayload = {
      dateOfDate: selectedDate.toISOString().split("T")[0],
      whatYouDid: whatYouDid.trim(),
      moneySpent: moneyValue,
      whatYouLiked: whatYouLiked.trim(),
      whatYouLearned: whatYouLearned.trim(),
    }

    if (editingDateId) {
      updateRecordedDate(editingDateId, datePayload)
    } else {
      addRecordedDate(datePayload)
    }

    closeModal()
  }

  const handleDeleteDate = (id: string) => {
    Alert.alert(
      "Delete Date",
      "Are you sure you want to delete this date record?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => removeRecordedDate(id),
          style: "destructive",
        },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Date History</Text>
        </View>

        {recordedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="heart-outline"
              size={64}
              color="#ccc"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Dates Recorded Yet</Text>
            <Text style={styles.emptyDescription}>
              Use this space to keep track of the dates you've been on. Record
              what you did, how much you spent, and what you learned!
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openCreateModal}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Your First Date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openCreateModal}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Date</Text>
            </TouchableOpacity>

            <View style={styles.datesContainer}>
              {recordedDates.map((date) => (
                <View key={date.id} style={styles.dateCard}>
                  <View style={styles.dateCardHeader}>
                    <Text style={styles.dateCardDate}>
                      {new Date(date.dateOfDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => openEditModal(date)}>
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#007AFF"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDate(date.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ff3b30"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.dateCardContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>What You Did</Text>
                      <Text style={styles.sectionText}>{date.whatYouDid}</Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Money Spent</Text>
                      <Text style={styles.sectionText}>
                        ${date.moneySpent.toFixed(2)}
                      </Text>
                    </View>

                    {date.whatYouLiked && (
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>What You Liked</Text>
                        <Text style={styles.sectionText}>
                          {date.whatYouLiked}
                        </Text>
                      </View>
                    )}

                    {date.whatYouLearned && (
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                          What You Learned
                        </Text>
                        <Text style={styles.sectionText}>
                          {date.whatYouLearned}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDateId ? "Edit Date" : "Record a Date"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={28} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>When was the date?</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    style={styles.datePicker}
                    {...(Platform.OS === "ios"
                      ? {
                          textColor: "#1a1a1a",
                          accentColor: "#007AFF",
                          themeVariant: "light" as const,
                        }
                      : {})}
                  />
                </View>
              )}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What did you do? *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe the date activity"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={whatYouDid}
                  onChangeText={setWhatYouDid}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>How much did you spend? *</Text>
                <View style={styles.inputWithPrefix}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.moneyInput}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={moneySpent}
                    onChangeText={setMoneySpent}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>
                  What did you like about it?
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Share what you enjoyed"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  value={whatYouLiked}
                  onChangeText={setWhatYouLiked}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What did you learn?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Share what you learned or insights"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  value={whatYouLearned}
                  onChangeText={setWhatYouLearned}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDate}
              >
                <Text style={styles.saveButtonText}>
                  {editingDateId ? "Update Date" : "Save Date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontWeight: "900",
    fontSize: 36,
    marginVertical: 0,
    marginTop: 24,
    color: "#1a1a1a",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  datesContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  dateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateCardDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateCardContent: {
    gap: 12,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    maxHeight: "90%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: "#fafbfc",
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  datePickerContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe5eb",
    backgroundColor: "#f3f6fa",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  datePicker: {
    backgroundColor: "#f3f6fa",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#fafbfc",
    fontFamily: "System",
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafbfc",
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    paddingHorizontal: 12,
  },
  moneyInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 14,
    color: "#1a1a1a",
    fontFamily: "System",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
})
