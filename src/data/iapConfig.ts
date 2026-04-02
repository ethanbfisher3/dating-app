import Purchases, { LOG_LEVEL, PURCHASES_ERROR_CODE } from "react-native-purchases";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { premiumStore } from "./premiumStore";

// Product ID for your one-time purchase (set up in RevenueCat dashboard)
export const PREMIUM_PRODUCT_ID = "unlimited_premium_lifetime_date_planner";

// Entitlement ID to check (set up in RevenueCat dashboard)
export const PREMIUM_ENTITLEMENT_ID = "premium";

let isInitialized = false;
let isInitializationAttempted = false;

export type PurchasePremiumResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "not_found"; details?: unknown }
  | { status: "failed"; message?: string };

function isExpoGoRuntime(): boolean {
  const appOwnership = (Constants as any)?.appOwnership;
  const executionEnvironment = (Constants as any)?.executionEnvironment;
  return appOwnership === "expo" || executionEnvironment === "storeClient";
}

function isTestStoreApiKey(apiKey: string): boolean {
  return apiKey.startsWith("test_");
}

async function ensureRevenueCatInitialized(): Promise<boolean> {
  if (!isInitialized && !isInitializationAttempted) {
    await initializeRevenueCat();
  }

  return isInitialized;
}

export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) return;

  isInitializationAttempted = true;

  try {
    // Enable debug logging in development
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const nativeStoreApiKey =
      Platform.OS === "ios" ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE;
    const testStoreApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE;
    const runningInExpoGo = isExpoGoRuntime();
    const apiKey = runningInExpoGo && testStoreApiKey ? testStoreApiKey : nativeStoreApiKey;

    if (!apiKey) {
      console.warn(
        "RevenueCat API key not found. Set EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE for Expo Go or native platform keys for dev/production builds.",
      );
      return;
    }

    if (runningInExpoGo && !isTestStoreApiKey(apiKey)) {
      console.warn(
        "RevenueCat native store keys do not work in Expo Go. Set EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE or use a development build.",
      );
      return;
    }

    Purchases.configure({
      apiKey,
    });

    isInitialized = true;
  } catch (error) {
    isInitialized = false;
    console.error("Failed to initialize RevenueCat:", error);
  }
}

export async function purchasePremium(): Promise<PurchasePremiumResult> {
  const isReady = await ensureRevenueCatInitialized();
  if (!isReady) {
    return {
      status: "failed",
      message:
        "RevenueCat is not configured. In Expo Go, set EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE. Otherwise, use a development build.",
    };
  }

  try {
    const products = await Purchases.getProducts([PREMIUM_PRODUCT_ID]);

    if (!products.length) {
      console.error(`Premium product "${PREMIUM_PRODUCT_ID}" not found via getProducts`);
      return { status: "not_found", details: { productIdsRequested: [PREMIUM_PRODUCT_ID], products } };
    }

    const premiumProduct = products[0] as any;
    let result: any;

    if (typeof (Purchases as any).purchaseStoreProduct === "function") {
      result = await (Purchases as any).purchaseStoreProduct(premiumProduct);
    } else if (typeof (Purchases as any).purchaseProduct === "function") {
      result = await (Purchases as any).purchaseProduct(PREMIUM_PRODUCT_ID);
    } else {
      return {
        status: "failed",
        message: "Installed RevenueCat SDK does not support direct product purchase APIs.",
      };
    }

    // Check if premium entitlement is now active
    const activeEntitlement = result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

    if (activeEntitlement && activeEntitlement.isActive) {
      // Update local premium store
      await premiumStore.unlockPremium();
      return { status: "success" };
    }

    // Fallback: if entitlement mapping is delayed/misconfigured but the product
    // transaction exists, treat as successful for testing flows.
    const purchasedProductIds = [
      ...(result.customerInfo.nonSubscriptionTransactions || []).map((tx: any) => tx?.productIdentifier),
      ...(result.customerInfo.allPurchasedProductIdentifiers || []),
    ].filter(Boolean);

    if (purchasedProductIds.includes(PREMIUM_PRODUCT_ID)) {
      await premiumStore.unlockPremium();
      return { status: "success" };
    }

    return {
      status: "failed",
      message: `Purchase completed but entitlement "${PREMIUM_ENTITLEMENT_ID}" is not active. Check RevenueCat entitlement mapping.`,
    };
  } catch (error: any) {
    const isSandboxTestFailure =
      String(error?.code) === "5" || String(error?.message || "").includes("Test purchase failure: no real transaction occurred");

    if (isSandboxTestFailure) {
      // Expected during RevenueCat failed-purchase testing flows.
      return { status: "cancelled" };
    }

    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { status: "cancelled" };
    } else if (error.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
      console.error("User not allowed to make purchases");
      return {
        status: "failed",
        message: "Purchases are not allowed on this account/device.",
      };
    } else {
      console.error("Purchase error:", error);
      return { status: "failed", message: error?.message };
    }
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  const isReady = await ensureRevenueCatInitialized();
  if (!isReady) {
    return false;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();

    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] && customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].isActive;
  } catch (error) {
    console.error("Failed to check premium status:", error);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  const isReady = await ensureRevenueCatInitialized();
  if (!isReady) {
    return false;
  }

  try {
    await Purchases.syncPurchases();
    const customerInfo = await Purchases.getCustomerInfo();

    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] && customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID].isActive;
  } catch (error) {
    console.error("Failed to restore purchases:", error);
    return false;
  }
}
