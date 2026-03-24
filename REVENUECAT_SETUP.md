# RevenueCat Setup Guide for Dating App

## ✅ What's Already Integrated

You now have:

1. ✅ RevenueCat SDK installed
2. ✅ IAP configuration (`src/data/iapConfig.ts`)
3. ✅ Paywall UI that triggers on feature limits
4. ✅ Premium state management with local persistence
5. ✅ App.tsx initialized with RevenueCat on startup

## 🚀 Next Steps: Complete RevenueCat Setup

### Step 1: Create RevenueCat Account

1. Go to https://app.revenuecat.com
2. Sign up with email
3. Create a new project (name it "Dating App")

---

### Step 2: Get Your API Keys

1. In RevenueCat dashboard, go to **Settings** → **API Keys**
2. Copy your **Apple API Key** (starts with `appl_`)
3. Copy your **Google API Key** (starts with `goog_`)

---

### Step 3: Update API Keys in Your App

Open `src/data/iapConfig.ts` and replace:

```typescript
const REVENUECAT_API_KEY_APPLE = "appl_YOUR_API_KEY_HERE";
const REVENUECAT_API_KEY_GOOGLE = "goog_YOUR_API_KEY_HERE";
```

With your actual keys from Step 2.

---

### Step 4: Create Product in RevenueCat Dashboard

1. Go to RevenueCat **Products** section
2. Click **Create Product**
3. Fill in:
   - **Name**: `Unlimited Premium`
   - **Identifier**: `unlimited_premium_lifetime` (must match `PREMIUM_PRODUCT_ID` in code)
   - **Type**: `Non-consumable` (one-time purchase)
   - **Price**: $3.99

> ℹ️ The identifier MUST match `PREMIUM_PRODUCT_ID = "unlimited_premium_lifetime"` in `src/data/iapConfig.ts`

---

### Step 5: Create Entitlement

1. Go to **Entitlements** section
2. Click **Create Entitlement**
3. Name it: `premium` (must match `PREMIUM_ENTITLEMENT_ID` in code)

---

### Step 6: Link Product to Entitlement

1. Go back to **Products**
2. Edit your `Unlimited Premium` product
3. Under "Entitlements", add the `premium` entitlement
4. Save

---

### Step 7: Link App Store & Google Play

#### iOS - Link App Store

1. In RevenueCat, go to **iOS Apps**
2. Add your app:
   - **Bundle ID**: `com.example.datingapp` (or your actual bundle ID from app.json)
   - **App Store Shared Secret**: Get from App Store Connect
3. RevenueCat will prompt you to create the product in App Store

#### Google Play - Link Play Store

1. In RevenueCat, go to **Android Apps**
2. Add your app:
   - **Package Name**: `com.example.datingapp` (from app.json)
   - **Service Account JSON**: Upload from Google Play Console
3. RevenueCat will sync with Play Store

---

### Step 8: Create Products in App Store & Play Store

#### App Store:

1. Go to App Store Connect
2. Create an in-app purchase:
   - **Type**: Non-consumable
   - **Reference Name**: `Unlimited Premium`
   - **Product ID**: `unlimited_premium_lifetime`
   - **Price Tier**: Select $3.99
   - **Available in**: All territories

#### Google Play:

1. Go to Google Play Console
2. Create an in-app product:
   - **Product ID**: `unlimited_premium_lifetime`
   - **Product Title**: `Unlimited Premium`
   - **Product Type**: Managed product
   - **Price**: $3.99 (default or per country)

---

## 🧪 Testing

### Sandbox/Testing Mode (iOS)

1. Create a Sandbox Tester account in App Store Connect:
   - Go to **Users and Access** → **Sandbox Testers**
   - Create test account
2. On your iPhone/simulator, sign out of regular Apple ID
3. During purchase on your app, sign in with **Sandbox Tester** account
4. Purchases process but charge sandbox (not real money)

### Sandbox Mode (Android)

1. In Google Play Console → **Settings** → **License Testing**
2. Add your Google account as a "License Tester"
3. Your Play Store account gets free purchases for testing

---

## 💡 How It Works in Your App

1. **User hits limit** (e.g., 5th date logged)
2. **Paywall shows** (src/Components/PaywallModal.tsx)
3. **User taps "Unlock Premium"**
4. **RevenueCat handles purchase** via native App Store/Play Store
5. **Purchase validates automatically** against Apple/Google servers
6. **premiumStore.unlockPremium()** called
7. **Feature gates unlock** (unlimited dates, wider radius, etc.)
8. **Status persists** in device storage

---

## 🔑 Key Files

- **`src/data/iapConfig.ts`** - RevenueCat setup & purchase logic
- **`src/data/premiumStore.ts`** - Local premium status persistence
- **`src/hooks/usePremium.ts`** - React hook for components
- **`src/Components/PaywallModal.tsx`** - Purchase UI

---

## 📦 Feature Gates to Add (Optional)

Currently only DateHistory is gated (5 dates limit). You can add:

1. **PlannedDateResults - Distance Limit**
   - Free: 5 miles
   - Premium: unlimited

2. **PlannedDateResults - Ideas Limit**
   - Free: 3 ideas/month
   - Premium: unlimited

Let me know if you want me to add these!

---

## ❓ FAQ

**Q: Do I need a backend?**
A: No. RevenueCat handles server-side validation.

**Q: What if user buys on Android, then switches to iOS?**
A: RevenueCat syncs across devices (uses their app user ID).

**Q: Can I test without real money?**
A: Yes, use sandbox testers on both platforms.

**Q: Where does the money go?**
A: App Store/Play Store takes 30%, RevenueCat takes ~3-5%, you get ~65-67%.

---

## 🚨 Common Issues

**"Product not found" error**
→ Check identifier matches exactly: `unlimited_premium_lifetime`

**Purchase doesn't unlock**
→ Check entitlement name matches: `premium`

**Can't see paywalls in testing**
→ Build and run on actual device, not simulator (IAP doesn't work in some simulators)

**"No current offering available"**
→ Products not linked to Offerings in RevenueCat dashboard

---

**Need help?** RevenueCat docs: https://docs.revenuecat.com/
