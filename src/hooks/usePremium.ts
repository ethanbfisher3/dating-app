import { useEffect, useState } from "react"
import { premiumStore, type PremiumStatus } from "../data/premiumStore"

export function usePremium() {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({
    isUnlocked: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStatus = async () => {
      setIsLoading(true)
      const status = await premiumStore.getPremiumStatus()
      setPremiumStatus(status)
      setIsLoading(false)
    }

    loadStatus()

    // Subscribe to changes
    const unsubscribe = premiumStore.subscribe(() => {
      loadStatus()
    })

    return unsubscribe
  }, [])

  return {
    isUnlocked: premiumStatus.isUnlocked,
    purchaseDate: premiumStatus.purchaseDate,
    isLoading,
    unlockPremium: () => premiumStore.unlockPremium(),
    resetPremium: () => premiumStore.resetPremium(),
  }
}
