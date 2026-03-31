import { useEffect, useState } from "react";
import Purchases, { PurchasesPackage } from "react-native-purchases";

export default function usePurchases() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifetimePremium, setLifetimePremium] = useState<PurchasesPackage["product"] | null>(null);

  useEffect(() => {
    const loadOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();

        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const pkg = offerings.current.availablePackages.find((p) => p.product.identifier === "unlimited_premium_lifetime_date_planner");
          setLifetimePremium(pkg.product);
        }
      } catch (error) {
        console.error("Error loading offerings:", error);
        setError("Failed to load offerings");
      }
    };

    loadOfferings();
  }, []);

  return { loading, error, lifetimePremium };
}
