import { useEffect, useState } from "react";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { initializeRevenueCat, PREMIUM_PRODUCT_ID } from "src/data/iapConfig";

let cachedLifetimePremium: PurchasesPackage["product"] | null = null;
let hasLoadedOfferings = false;
let offeringsRequest: Promise<PurchasesPackage["product"] | null> | null = null;

const getErrorMessage = (error: any): string => {
  const message = String(error?.message || "");
  const underlying = String(error?.underlyingErrorMessage || "");
  const fullMessage = `${message} ${underlying}`;

  if (
    fullMessage.includes("There is an issue with your configuration") ||
    fullMessage.includes("no Play Store products") ||
    fullMessage.includes("why-are-offerings-empty")
  ) {
    return "RevenueCat product is not configured yet.";
  }

  if (fullMessage.includes("BILLING_UNAVAILABLE") || fullMessage.includes("Billing service unavailable")) {
    return "Google Play Billing is unavailable on this device/account.";
  }

  return "Failed to load premium product";
};

const loadLifetimePremiumProduct = async (): Promise<PurchasesPackage["product"] | null> => {
  if (hasLoadedOfferings) {
    return cachedLifetimePremium;
  }

  if (!offeringsRequest) {
    offeringsRequest = (async () => {
      try {
        await initializeRevenueCat();
        const products = await Purchases.getProducts([PREMIUM_PRODUCT_ID]);
        cachedLifetimePremium = (products[0] as PurchasesPackage["product"]) || null;
      } catch {
        cachedLifetimePremium = null;
      } finally {
        hasLoadedOfferings = true;
        offeringsRequest = null;
      }

      return cachedLifetimePremium;
    })();
  }

  return offeringsRequest;
};

export default function usePurchases() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifetimePremium, setLifetimePremium] = useState<PurchasesPackage["product"] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOfferings = async () => {
      try {
        setLoading(true);
        const product = await loadLifetimePremiumProduct();

        if (!isMounted) {
          return;
        }

        setLifetimePremium(product);
        setError(null);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        const message = getErrorMessage(error);
        const shouldWarnOnly =
          message === "RevenueCat product is not configured yet." ||
          message === "Google Play Billing is unavailable on this device/account.";

        if (shouldWarnOnly) {
          console.warn("RevenueCat premium product unavailable:", message);
        } else {
          console.error("Error loading premium product:", error);
        }

        setLifetimePremium(null);
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOfferings();

    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, error, lifetimePremium };
}
