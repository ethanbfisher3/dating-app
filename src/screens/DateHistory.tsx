import React, { useEffect, useRef, useState } from "react"
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
  KeyboardAvoidingView,
  Image,
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
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { usePremium } from "../hooks/usePremium"
import PaywallModal from "../Components/PaywallModal"

function getRatingColor(n: number): string {
  // hue 0 = red (1), hue 120 = green (10)
  const hue = Math.round(((n - 1) / 9) * 120)
  return `hsl(${hue}, 75%, 42%)`
}

export default function DateHistoryScreen({
  navigation,
}: {
  navigation: AppNavigation
}) {
  const [recordedDates, setRecordedDates] = useState<RecordedDate[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const { isUnlocked } = usePremium()
  const FREE_TIER_LIMIT = 5

  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [whoWentWith, setWhoWentWith] = useState("")
  const [whatYouDid, setWhatYouDid] = useState("")
  const [moneySpent, setMoneySpent] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [whatYouLiked, setWhatYouLiked] = useState("")
  const [whatYouLearned, setWhatYouLearned] = useState("")
  const modalScrollRef = useRef<ScrollView>(null)

  const insets = useSafeAreaInsets()

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
    if (Platform.OS === "android") {
      setShowDatePicker(false)
    }

    const isConfirmed = Platform.OS === "ios" || event.type === "set"
    if (isConfirmed && date) {
      setSelectedDate(date)
    }
  }

  const resetForm = () => {
    setWhoWentWith("")
    setWhatYouDid("")
    setMoneySpent("")
    setRating(null)
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
    setWhoWentWith(date.whoWentWith)
    setWhatYouDid(date.whatYouDid)
    setMoneySpent(String(date.moneySpent))
    setRating(date.rating)
    setWhatYouLiked(date.whatYouLiked)
    setWhatYouLearned(date.whatYouLearned)
    setShowDatePicker(false)
    setModalVisible(true)
  }

  const handleSaveDate = () => {
    if (!whoWentWith.trim()) {
      Alert.alert("Error", "Please enter who you went out with")
      return
    }

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

    if (!whatYouDid.trim()) {
      Alert.alert("Error", "Please enter what you did")
      return
    }

    // Check if free user is at limit (editing doesn't count toward limit)
    if (
      !editingDateId &&
      !isUnlocked &&
      recordedDates.length >= FREE_TIER_LIMIT
    ) {
      setPaywallVisible(true)
      return
    }

    const datePayload = {
      dateOfDate: selectedDate.toISOString().split("T")[0],
      whoWentWith: whoWentWith.trim(),
      whatYouDid: whatYouDid.trim(),
      moneySpent: moneyValue,
      rating,
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

  const handleFormInputFocus = (event: any) => {
    const target = event?.target
    if (!target) {
      return
    }

    setTimeout(() => {
      ;(
        modalScrollRef.current as any
      )?.scrollResponderScrollNativeHandleToKeyboard?.(target, 120, true)
    }, 120)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Date History</Text>
          {/* <Text style={styles.subtitle}>Record the dates you've been on</Text> */}
        </View>

        <Image
          source={require("../assets/images/date_over.jpg")}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 12,
            paddingHorizontal: 24,
          }}
        />

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
                    {date.whoWentWith ? (
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Went With</Text>
                        <Text style={styles.sectionText}>
                          {date.whoWentWith}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>Money Spent</Text>
                      <Text style={styles.sectionText}>
                        ${date.moneySpent.toFixed(2)}
                      </Text>
                    </View>

                    {date.rating != null && (
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Rating</Text>
                        <Text style={styles.sectionText}>
                          {date.rating} / 10
                        </Text>
                      </View>
                    )}

                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>What You Did</Text>
                      <Text style={styles.sectionText}>{date.whatYouDid}</Text>
                    </View>

                    {date.whatYouLiked ? (
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>What You Liked</Text>
                        <Text style={styles.sectionText}>
                          {date.whatYouLiked}
                        </Text>
                      </View>
                    ) : null}

                    {date.whatYouLearned ? (
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                          What You Learned
                        </Text>
                        <Text style={styles.sectionText}>
                          {date.whatYouLearned}
                        </Text>
                      </View>
                    ) : null}
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
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
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
              ref={modalScrollRef}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>When was the date? *</Text>
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
                    display={Platform.OS === "ios" ? "inline" : "calendar"}
                    onChange={handleDateChange}
                    style={styles.datePicker}
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
                      onPress={() => setShowDatePicker(false)}
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
              )}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Who did you go out with? *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Name(s) of who you went with"
                  placeholderTextColor="#999"
                  value={whoWentWith}
                  onChangeText={setWhoWentWith}
                  onFocus={handleFormInputFocus}
                />
              </View>

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
                  onFocus={handleFormInputFocus}
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
                    keyboardType="number-pad"
                    value={moneySpent}
                    onChangeText={setMoneySpent}
                    onFocus={handleFormInputFocus}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Rate the date (1–10)</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                    const color = getRatingColor(n)
                    const selected = rating === n
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.ratingButton,
                          { borderColor: color },
                          selected && { backgroundColor: color },
                        ]}
                        onPress={() => setRating(selected ? null : n)}
                      >
                        <Text
                          style={[
                            styles.ratingButtonText,
                            { color: selected ? "#fff" : color },
                          ]}
                        >
                          {n}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
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
                  onFocus={handleFormInputFocus}
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
                  onFocus={handleFormInputFocus}
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
        </KeyboardAvoidingView>
      </Modal>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        reason="date_history_limit"
      />
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
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    color: "#555",
  },
  title: {
    fontWeight: "900",
    fontSize: 36,
    marginTop: 24,
    marginBottom: 12,
    color: "#1a1a1a",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 60,
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
    margin: 24,
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
    flexDirection: "row",
    flexWrap: "wrap",
  },
  section: {
    gap: 4,
    minWidth: "47%",
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
    marginVertical: 8,
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
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafbfc",
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
})
