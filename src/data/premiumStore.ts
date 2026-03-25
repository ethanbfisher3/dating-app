import AsyncStorage from "@react-native-async-storage/async-storage"

const PREMIUM_KEY = "@premium_unlocked"
const IDEAS_GENERATED_KEY = "@ideas_generated_timestamps"
const FREE_TIER_IDEAS_LIMIT_PER_MONTH = 5

export interface PremiumStatus {
  isUnlocked: boolean
  purchaseDate?: string
}

class PremiumStore {
  private listeners: Set<() => void> = new Set()
  private inMemoryPremiumStatus: PremiumStatus = { isUnlocked: false }
  private inMemoryIdeaTimestamps: string[] = []

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }

  async isPremiumUnlocked(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_KEY)
      return data ? JSON.parse(data).isUnlocked : this.inMemoryPremiumStatus.isUnlocked
    } catch {
      return this.inMemoryPremiumStatus.isUnlocked
    }
  }

  async getPremiumStatus(): Promise<PremiumStatus> {
    try {
      const data = await AsyncStorage.getItem(PREMIUM_KEY)
      return data ? JSON.parse(data) : this.inMemoryPremiumStatus
    } catch {
      return this.inMemoryPremiumStatus
    }
  }

  async unlockPremium(): Promise<void> {
    const status: PremiumStatus = {
      isUnlocked: true,
      purchaseDate: new Date().toISOString(),
    }
    this.inMemoryPremiumStatus = status
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(status))
    } catch {
      // Keep in-memory premium state for current session when native storage is unavailable.
    }
    this.notify()
  }

  async resetPremium(): Promise<void> {
    this.inMemoryPremiumStatus = { isUnlocked: false }
    try {
      await AsyncStorage.removeItem(PREMIUM_KEY)
    } catch {
      // Ignore when native storage is unavailable.
    }
    this.notify()
  }

  async canGenerateIdeas(isUnlocked: boolean): Promise<boolean> {
    if (isUnlocked) return true

    try {
      const data = await AsyncStorage.getItem(IDEAS_GENERATED_KEY)
      const timestamps: string[] = data ? JSON.parse(data) : this.inMemoryIdeaTimestamps

      // Filter to only this month's generations
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const thisMonthCount = timestamps.filter(
        (timestamp) => new Date(timestamp) > monthAgo,
      ).length

      return thisMonthCount < FREE_TIER_IDEAS_LIMIT_PER_MONTH
    } catch {
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const thisMonthCount = this.inMemoryIdeaTimestamps.filter(
        (timestamp) => new Date(timestamp) > monthAgo,
      ).length
      return thisMonthCount < FREE_TIER_IDEAS_LIMIT_PER_MONTH
    }
  }

  async recordIdeaGeneration(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(IDEAS_GENERATED_KEY)
      const timestamps: string[] = data ? JSON.parse(data) : this.inMemoryIdeaTimestamps

      // Keep only last 90 days to prevent storage bloat
      const ninetyDaysAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString()
      const filtered = timestamps.filter((t) => t > ninetyDaysAgo)

      filtered.push(new Date().toISOString())
      this.inMemoryIdeaTimestamps = filtered
      await AsyncStorage.setItem(IDEAS_GENERATED_KEY, JSON.stringify(filtered))
    } catch {
      const ninetyDaysAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000,
      ).toISOString()
      this.inMemoryIdeaTimestamps = this.inMemoryIdeaTimestamps
        .filter((t) => t > ninetyDaysAgo)
        .concat(new Date().toISOString())
    }
  }

  async getIdeasGeneratedThisMonth(isUnlocked: boolean): Promise<number> {
    if (isUnlocked) return 999 // Premium users have unlimited

    try {
      const data = await AsyncStorage.getItem(IDEAS_GENERATED_KEY)
      const timestamps: string[] = data ? JSON.parse(data) : this.inMemoryIdeaTimestamps

      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      return timestamps.filter((timestamp) => new Date(timestamp) > monthAgo)
        .length
    } catch {
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return this.inMemoryIdeaTimestamps.filter(
        (timestamp) => new Date(timestamp) > monthAgo,
      ).length
    }
  }
}

export const premiumStore = new PremiumStore()
