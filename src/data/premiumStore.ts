import AsyncStorage from "@react-native-async-storage/async-storage";

const PREMIUM_KEY = "@premium_unlocked";

export interface PremiumStatus {
  isUnlocked: boolean;
  purchaseDate?: string;
}

class PremiumStore {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  async isPremiumUnlocked(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_KEY);
      return data ? JSON.parse(data).isUnlocked : false;
    } catch {
      return false;
    }
  }

  async getPremiumStatus(): Promise<PremiumStatus> {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_KEY);
      return data ? JSON.parse(data) : { isUnlocked: false };
    } catch {
      return { isUnlocked: false };
    }
  }

  async unlockPremium(): Promise<void> {
    const status: PremiumStatus = {
      isUnlocked: true,
      purchaseDate: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(status));
    this.notify();
  }

  async resetPremium(): Promise<void> {
    await AsyncStorage.removeItem(PREMIUM_KEY);
    this.notify();
  }
}

export const premiumStore = new PremiumStore();
