import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { Platform } from "react-native";
import { premiumStore } from "./premiumStore";

// Product ID for your one-time purchase (set up in RevenueCat dashboard)
export const PREMIUM_PRODUCT_ID = "unlimited_premium_lifetime_date_planner";

// Entitlement ID to check (set up in RevenueCat dashboard)
export const PREMIUM_ENTITLEMENT_ID = "premium";

let isInitialized = false;

export type PurchasePremiumResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "not_found"; details?: unknown }
  | { status: "failed"; message?: string };

export async function initializeRevenueCat(): Promise<void> {
  if (isInitialized) return;

  try {
    // Enable debug logging in development
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const apiKey =
      Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE
        : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE;

    if (!apiKey) {
      throw new Error(
        `RevenueCat API key not found. Check app.json for revenueCatApiKeyApple/revenueCatApiKeyGoogle`,
      );
    }

    await Purchases.configure({
      apiKey,
    });

    isInitialized = true;
    console.log("RevenueCat initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RevenueCat:", error);
  }
}

export async function purchasePremium(): Promise<PurchasePremiumResult> {
  try {
    // Get available offerings
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.error("No current offering available");
      return { status: "failed", message: "No current offering available" };
    }

    // RevenueCat package identifiers (e.g. "$rc_lifetime") are different from
    // store product identifiers (e.g. "unlimited_premium_lifetime_date_planner").
    // We try both so dashboard/package naming does not break purchase flow.
    const getStoreProductId = (pkg: any): string => {
      return pkg?.product?.identifier || pkg?.storeProduct?.identifier || "";
    };

    const currentPackages = offerings.current.availablePackages || [];
    const allPackages = Object.values(offerings.all || {}).flatMap(
      (offering: any) => offering?.availablePackages || [],
    );
    const candidatePackages =
      currentPackages.length > 0 ? currentPackages : allPackages;

    // Prefer store product ID match, then fallback to package ID match.
    const premiumPackage =
      candidatePackages.find(
        (pkg: any) => getStoreProductId(pkg) === PREMIUM_PRODUCT_ID,
      ) ||
      candidatePackages.find(
        (pkg: any) => pkg?.identifier === PREMIUM_PRODUCT_ID,
      );

    if (!premiumPackage) {
      const available = candidatePackages.map((pkg: any) => ({
        packageId: pkg?.identifier,
        productId: getStoreProductId(pkg),
      }));
      console.error("Available RevenueCat packages/products:", available);
      console.error(`Premium product "${PREMIUM_PRODUCT_ID}" not found`);
      return { status: "not_found", details: available };
    }

    // Purchase the package
    const result = await Purchases.purchasePackage(premiumPackage);

    // Check if premium entitlement is now active
    const activeEntitlement =
      result.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

    if (activeEntitlement && activeEntitlement.isActive) {
      // Update local premium store
      await premiumStore.unlockPremium();
      return { status: "success" };
    }

    // Fallback: if entitlement mapping is delayed/misconfigured but the product
    // transaction exists, treat as successful for testing flows.
    const purchasedProductIds = [
      ...(result.customerInfo.nonSubscriptionTransactions || []).map(
        (tx: any) => tx?.productIdentifier,
      ),
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
      String(error?.code) === "5" ||
      String(error?.message || "").includes(
        "Test purchase failure: no real transaction occurred",
      );

    if (isSandboxTestFailure) {
      // Expected during RevenueCat failed-purchase testing flows.
      return { status: "cancelled" };
    }

    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log("User cancelled purchase");
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
