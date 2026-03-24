# Premium Purchase Setup Guide

## Current Implementation

You now have:

1. ✅ **Premium Store** (`src/data/premiumStore.ts`) - Local persistence
2. ✅ **usePremium Hook** (`src/hooks/usePremium.ts`) - React component integration
3. ✅ **Paywall Modal** (`src/Components/PaywallModal.tsx`) - UI for purchases
4. ✅ **Feature Gates** - DateHistory limits free users to 5 dates

## Next Step: Add Real Purchase Processing

You need to integrate **RevenueCat** (easiest IAP across iOS/Android) or **Expo IAP**.

### Option 1: RevenueCat (Recommended)

RevenueCat handles all the complexity of App Store/Google Play IAP.

**Install:**

```bash
npm install purchases-react-native
npx expo prebuild --clean
```

**Setup:**

1. Create product in RevenueCat dashboard:
   - ID: `unlimited_premium_lifetime`
   - Price: $3.99
   - Type: Non-consumable
2. Link to App Store & Google Play
3. Configure platform-specific StoreKit configs

**Update `env` files or create a new `iap-config.ts`:**

```typescript
// src/data/iapConfig.ts
import Purchases from "purchases-react-native";

const REVENUECAT_API_KEY_APPLE = "appl_xxxx...";
const REVENUECAT_API_KEY_GOOGLE = "goog_xxxx...";
const PREMIUM_PRODUCT_ID = "unlimited_premium_lifetime";

export async function initializeRevenueCat() {
  try {
    await Purchases.configure({
      apiKey:
        Platform.OS === "ios"
          ? REVENUECAT_API_KEY_APPLE
          : REVENUECAT_API_KEY_GOOGLE,
    });
  } catch (e) {
    console.error("RevenueCat init failed:", e);
  }
}

export async function purchasePremium() {
  try {
    const offerings = await Purchases.getOfferings();
    const premium = offerings.current?.availablePackages.find(
      (pkg) => pkg.identifier === PREMIUM_PRODUCT_ID,
    );

    if (!premium) {
      throw new Error("Premium product not found");
    }

    const transaction = await Purchases.purchasePackage(premium);

    if (transaction.customerInfo.entitlements.active["premium"]?.isActive) {
      return true;
    }
  } catch (e: any) {
    if (e.userCancelled) {
      console.log("User cancelled purchase");
    } else {
      console.error("Purchase error:", e);
    }
    return false;
  }
}
```

**Update `PaywallModal.tsx` to call it:**

```typescript
const handlePurchase = async () => {
  setIsProcessing(true);
  try {
    const success = await purchasePremium(); // from iap-config
    if (success) {
      await unlockPremium();
      onClose();
    }
  } catch (error) {
    console.error("Purchase failed:", error);
  } finally {
    setIsProcessing(false);
  }
};
```

**Initialize in App.tsx:**

```typescript
useEffect(() => {
  initializeRevenueCat();
}, []);
```

---

### Option 2: Expo IAP (Simpler, iOS/Android)

```bash
npm install expo-in-app-purchases
```

Similar flow, but requires manual StoreKit config per platform.

---

## Feature Gating Checklist

- [x] DateHistory: Free tier max 5 dates
- [ ] PlannedDateResults: Free tier max 5 miles radius (TODO)
- [ ] PlannedDateResults: Free tier max 3 ideas/month (TODO)

Would you like me to:

1. Add the other feature gates (distance, ideas limit)?
2. Continue with RevenueCat setup?
3. Keep it as-is and test locally first?
