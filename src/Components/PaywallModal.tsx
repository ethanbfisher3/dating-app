import { useState } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { usePremium } from "../hooks/usePremium"
import { purchasePremium } from "../data/iapConfig"

interface PaywallProps {
  visible: boolean
  onClose: () => void
  onPurchase?: () => Promise<void>
  reason?:
    | "date_history_limit"
    | "mile_radius_limit"
    | "ideas_limit"
    | "general"
}

export default function PaywallModal({
  visible,
  onClose,
  onPurchase,
  reason = "general",
}: PaywallProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { resetPremium } = usePremium()

  const reasonMessages: Record<string, { title: string; description: string }> =
    {
      date_history_limit: {
        title: "Date History Limit Reached",
        description:
          "You've recorded 5 dates. Upgrade to save unlimited dates.",
      },
      mile_radius_limit: {
        title: "Search Radius Limited",
        description:
          "Free tier searches 5 miles away. Go Premium for 25+ miles.",
      },
      ideas_limit: {
        title: "Date Ideas Limit Reached",
        description:
          "You've generated your monthly date ideas. Upgrade for unlimited.",
      },
      general: {
        title: "Unlock Premium Features",
        description:
          "Get unlimited date history, search radius, and idea generation.",
      },
    }

  const { title, description } = reasonMessages[reason]

  const handlePurchase = async () => {
    setIsProcessing(true)
    try {
      const result = await purchasePremium()
      if (result.status === "success") {
        Alert.alert(
          "Success!",
          "You've unlocked Premium. Enjoy unlimited features!",
        )
        onClose()
      } else if (result.status === "cancelled") {
        Alert.alert(
          "Purchase Cancelled",
          "No worries, you can upgrade anytime.",
        )
      } else if (result.status === "not_found") {
        Alert.alert(
          "Product Not Available",
          "We couldn't find your premium product in the current offering. Please check RevenueCat product/offering setup.",
        )
      } else {
        Alert.alert(
          "Purchase Failed",
          result.message || "Please try again later.",
        )
      }
    } catch (error) {
      console.error("Purchase error:", error)
      Alert.alert("Error", "Something went wrong during purchase.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetPremium = async () => {
    try {
      await resetPremium()
      Alert.alert(
        "Premium Removed",
        "Premium access has been reset for testing.",
      )
    } catch (error) {
      console.error("Reset premium error:", error)
      Alert.alert("Error", "Could not reset premium access.")
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#1a1a1a" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Icon/Header */}
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={64} color="#FFD700" />
            </View>

            {/* Title & Description */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {/* Feature List */}
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#FF6B6B"
                  style={styles.featureIcon}
                />
                <View style={styles.featureContent}>
                  <Text style={styles.featureText}>Unlimited Date History</Text>
                  <Text style={styles.featureSubtext}>
                    Save as many dates as you want
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#4ECDC4"
                  style={styles.featureIcon}
                />
                <View style={styles.featureContent}>
                  <Text style={styles.featureText}>Extended Search Radius</Text>
                  <Text style={styles.featureSubtext}>
                    Search up to 25+ miles away
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#95E1D3"
                  style={styles.featureIcon}
                />
                <View style={styles.featureContent}>
                  <Text style={styles.featureText}>Unlimited Date Ideas</Text>
                  <Text style={styles.featureSubtext}>
                    Generate as many ideas as you want
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#F7B731"
                  style={styles.featureIcon}
                />
                <View style={styles.featureContent}>
                  <Text style={styles.featureText}>Save Unlimited Ideas</Text>
                  <Text style={styles.featureSubtext}>
                    Build your personal idea collection
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#A29BFE"
                  style={styles.featureIcon}
                />
                <View style={styles.featureContent}>
                  <Text style={styles.featureText}>One-Time Purchase</Text>
                  <Text style={styles.featureSubtext}>
                    No subscriptions or hidden fees
                  </Text>
                </View>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>One-Time Payment</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>$3.99</Text>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.purchaseButton, isProcessing && styles.disabled]}
              onPress={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.purchaseButtonText}>Unlock Premium</Text>
              )}
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <View style={styles.devFooter}>
              <TouchableOpacity
                style={styles.devResetButton}
                onPress={handleResetPremium}
                disabled={isProcessing}
              >
                <Text style={styles.devResetButtonText}>
                  Remove Premium (DEV)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 4,
  },
  featureIcon: {
    marginRight: 4,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureText: {
    fontSize: 15,
    color: "#2c3e50",
    fontWeight: "600",
    marginBottom: 2,
  },
  featureSubtext: {
    fontSize: 13,
    color: "#888",
    fontWeight: "400",
  },
  priceContainer: {
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#007AFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  priceRow: {
    alignItems: "baseline",
    gap: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  devFooter: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  purchaseButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  disabled: {
    opacity: 0.6,
  },
  devResetButton: {
    borderWidth: 1,
    borderColor: "#d93025",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  devResetButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d93025",
  },
})
