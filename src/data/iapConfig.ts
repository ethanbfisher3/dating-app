import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { Platform } from "react-native";
import { premiumStore } from "./premiumStore";

// These are placeholder API keys - you MUST replace with your actual RevenueCat keys
// Get them from: https://app.revenuecat.com/dashboard/apikeys
const REVENUECAT_API_KEY_APPLE = "appl_YOUR_API_KEY_HERE";
const REVENUECAT_API_KEY_GOOGLE = "goog_YOUR_API_KEY_HERE";

// Product ID for your one-time purchase (set up in RevenueCat dashboard)
export const PREMIUM_PRODUCT_ID = "unlimited_premium_lifetime";

// Entitlement ID to check (set up in RevenueCat dashboard)
export const PREMIUM_ENTITLEMENT_ID = "premium";

let isInitialized = false;

export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) return;

  try {
    // Enable debug logging in development
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with appropriate API key
    const apiKey =
      Platform.OS === "ios"
        ? REVENUECAT_API_KEY_APPLE
        : REVENUECAT_API_KEY_GOOGLE;

    await Purchases.configure({
      apiKey,
      appUserID: undefined, // Let RevenueCat generate app user ID
    });

    isInitialized = true;
    console.log("RevenueCat initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RevenueCat:", error);
  }
}

export async function purchasePremium(): Promise<boolean> {
  try {
    // Get available offerings
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.error("No current offering available");
      return false;
    }

    // Find the premium product
    const premiumPackage = offerings.current.availablePackages.find(
      (pkg) => pkg.identifier === PREMIUM_PRODUCT_ID,
    );

    if (!premiumPackage) {
      console.error(`Premium product "${PREMIUM_PRODUCT_ID}" not found`);
      return false;
    }

    // Purchase the package
    const result = await Purchases.purchasePackage(premiumPackage);

    // Check if premium entitlement is now active
    if (
      result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] &&
      result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].isActive
    ) {
      // Update local premium store
      await premiumStore.unlockPremium();
      return true;
    }

    return false;
  } catch (error: any) {
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log("User cancelled purchase");
    } else if (error.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
      console.error("User not allowed to make purchases");
    } else {
      console.error("Purchase error:", error);
    }
    return false;
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    return (
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] &&
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].isActive
    );
  } catch (error) {
    console.error("Failed to check premium status:", error);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    await Purchases.syncPurchases();
    const customerInfo = await Purchases.getCustomerInfo();

    return (
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] &&
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].isActive
    );
  } catch (error) {
    console.error("Failed to restore purchases:", error);
    return false;
  }
}
