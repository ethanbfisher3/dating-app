import Purchases, { LOG_LEVEL, PURCHASES_ERROR_CODE } from "react-native-purchases";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { premiumStore } from "./premiumStore";

// Product ID for your one-time purchase (set up in RevenueCat dashboard)
export const PREMIUM_PRODUCT_ID = "lifetime_premium";

// Entitlement ID to check (set up in RevenueCat dashboard)
export const PREMIUM_ENTITLEMENT_ID = "EthDog GameDev Pro";

let isInitialized = false;
let isInitializationAttempted = false;
let initializationPromise: Promise<void> | null = null;

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
  if (!isInitialized) {
    await initializeRevenueCat();
  }

  return isInitialized;
}

async function findPremiumPackage() {
  const offerings = await Purchases.getOfferings();
  const allOfferings = Object.values(offerings.all || {});
  const allPackages = allOfferings.flatMap((offering) => offering.availablePackages || []);

  const matchingPackage =
    allPackages.find((pkg) => pkg.product.identifier === PREMIUM_PRODUCT_ID) ||
    allPackages.find((pkg) => pkg.identifier === PREMIUM_PRODUCT_ID) ||
    offerings.current?.availablePackages?.[0] ||
    allPackages[0] ||
    null;

  return matchingPackage;
}

export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) return;
  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  initializationPromise = (async () => {
    isInitializationAttempted = true;

    try {
      // Enable debug logging in development
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      const runningInExpoGo = isExpoGoRuntime();
      const revenueCatApiKey = runningInExpoGo
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE
        : Platform.OS === "ios"
          ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE
          : Platform.OS === "android"
            ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE
            : undefined;

      if (!revenueCatApiKey) {
        console.warn(
          runningInExpoGo
            ? "RevenueCat API key not found for Expo Go. Set EXPO_PUBLIC_REVENUECAT_API_KEY_TEST_STORE (or revenueCatApiKeyTestStore in Expo extra)."
            : `RevenueCat API key not found for ${Platform.OS}. Set EXPO_PUBLIC_REVENUECAT_API_KEY_${Platform.OS === "ios" ? "APPLE" : "GOOGLE"} in your EAS/local env.`,
        );
        return;
      }

      Purchases.configure({
        apiKey: revenueCatApiKey,
      });

      // Force refresh cached product data
      await Purchases.invalidateCustomerInfoCache();

      isInitialized = true;

      // List available products
      try {
        const offerings = await Purchases.getOfferings();
        const allProducts = offerings.all;

        if (Object.keys(allProducts).length > 0) {
          console.log("📦 Available RevenueCat Products:");
          Object.entries(allProducts).forEach(([offeringId, offering]) => {
            console.log(`  Offering: ${offeringId}`);
            offering.availablePackages.forEach((pkg) => {
              console.log(
                `    - ${pkg.product.title} | package=${pkg.identifier} | product=${pkg.product.identifier} | ${pkg.product.priceString}`,
              );
            });
          });
        } else {
          console.log("No offerings configured in RevenueCat");
        }
      } catch (error) {
        console.warn("Could not fetch available products:", error);
      }
    } catch (error) {
      isInitialized = false;
      console.error("Failed to initialize RevenueCat:", error);
    } finally {
      initializationPromise = null;
    }
  })();

  await initializationPromise;
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
    const premiumPackage = await findPremiumPackage();

    if (!premiumPackage) {
      console.error(`Premium package/product "${PREMIUM_PRODUCT_ID}" not found via offerings`);
      return { status: "not_found", details: { productIdRequested: PREMIUM_PRODUCT_ID } };
    }

    let result: any;

    if (typeof (Purchases as any).purchasePackage === "function") {
      result = await (Purchases as any).purchasePackage(premiumPackage);
    } else if (typeof (Purchases as any).purchaseStoreProduct === "function") {
      result = await (Purchases as any).purchaseStoreProduct(premiumPackage.product);
    } else if (typeof (Purchases as any).purchaseProduct === "function") {
      result = await (Purchases as any).purchaseProduct(premiumPackage.product.identifier);
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

    if (purchasedProductIds.includes(PREMIUM_PRODUCT_ID) || purchasedProductIds.includes(premiumPackage.product.identifier)) {
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
    const fullErrorText = `${String(error?.message || "")} ${String(error?.underlyingErrorMessage || "")}`;
    const hasDeveloperError = fullErrorText.includes("DEVELOPER_ERROR") || fullErrorText.includes("signed correctly");

    if (isSandboxTestFailure) {
      // Expected during RevenueCat failed-purchase testing flows.
      return { status: "cancelled" };
    }

    if (hasDeveloperError) {
      return {
        status: "failed",
        message:
          "Google Play rejected the purchase setup (DEVELOPER_ERROR). Install this app from your Play testing track using a tester account, and make sure the build is signed with the Play-uploaded key.",
      };
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
