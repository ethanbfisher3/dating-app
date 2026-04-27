import React, { useEffect, useRef, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView, TestIds } from "react-native-google-mobile-ads";

// 1. Define your real IDs
const ANDROID_AD_UNIT_ID = "ca-app-pub-9592701510571371/7208407410";
const IOS_AD_UNIT_ID = "ca-app-pub-9592701510571371/1696926982";

// 2. Conditionally select the correct real ID based on the OS
const PRODUCTION_ID = Platform.select({
  android: ANDROID_AD_UNIT_ID,
  ios: IOS_AD_UNIT_ID,
});

// 3. Fallback to Test Ads during development
const AD_UNIT_ID = __DEV__ ? TestIds.NATIVE : PRODUCTION_ID;

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ethanbfisher3.node_master";
const FALLBACK_ICON = require("../assets/images/uncrossed/nodemaster_icon_512.jpg");

type CustomNativeAdProps = {
  onLoaded?: () => void;
  onError?: () => void;
};

export default function CustomNativeAd({ onLoaded, onError }: CustomNativeAdProps) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const readyReportedRef = useRef(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimeout = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const triggerFallback = (reason: string) => {
    console.warn(`[CustomNativeAd] ${reason}; showing fallback promo.`);
    setShowFallback(true);
    onError?.();
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1600);

    fetch("https://clients3.google.com/generate_204", {
      method: "GET",
      signal: controller.signal,
    })
      .then(() => {
        if (!isMounted) {
          return;
        }

        setConnectionChecked(true);
        setShowFallback(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setConnectionChecked(true);
        setShowFallback(true);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (readyReportedRef.current) {
      return;
    }

    if (showFallback || nativeAd) {
      readyReportedRef.current = true;
      clearLoadTimeout();
      onLoaded?.();
    }
  }, [nativeAd, onLoaded, showFallback]);

  useEffect(() => {
    if (showFallback || nativeAd || !connectionChecked) {
      clearLoadTimeout();
      return;
    }

    if (loadTimeoutRef.current) {
      return;
    }

    loadTimeoutRef.current = setTimeout(() => {
      loadTimeoutRef.current = null;
      if (!nativeAd && !showFallback) {
        triggerFallback("Native ad load timed out");
      }
    }, 5000);

    return clearLoadTimeout;
  }, [connectionChecked, nativeAd, showFallback]);

  useEffect(() => {
    let isMounted = true;

    if (!AD_UNIT_ID) {
      console.error("[CustomNativeAd] Missing ad unit id. Check your AdMob config and platform-specific IDs.");
      triggerFallback("Missing ad unit id");
      return () => {
        isMounted = false;
      };
    }

    if (!connectionChecked) {
      return () => {
        isMounted = false;
      };
    }

    if (!connectionChecked || showFallback) {
      return () => {
        isMounted = false;
      };
    }

    NativeAd.createForAdRequest(AD_UNIT_ID)
      .then((ad) => {
        if (isMounted) {
          setNativeAd(ad);
        } else {
          ad.destroy();
        }
      })
      .catch((error) => {
        console.warn("[CustomNativeAd] Native ad failed to load; showing fallback promo.", error);
        if (isMounted) {
          setShowFallback(true);
        }
        onError?.();
      });

    return () => {
      isMounted = false;
      clearLoadTimeout();
      setNativeAd((current) => {
        current?.destroy();
        return null;
      });
    };
  }, [connectionChecked, showFallback]);

  if (showFallback) {
    return (
      <Pressable
        accessibilityRole="link"
        onPress={() =>
          Linking.openURL(PLAY_STORE_URL).catch((error) => {
            console.warn("[CustomNativeAd] Failed to open Play Store.", error);
          })
        }
        style={styles.fallbackContainer}
      >
        <View style={styles.fallbackHeaderRow}>
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
          <Text style={styles.fallbackLabel}>Sponsored</Text>
        </View>

        <View style={styles.fallbackContentRow}>
          <Image source={FALLBACK_ICON} style={styles.fallbackIcon} />
          <View style={styles.fallbackTextColumn}>
            <Text style={styles.fallbackTitle} numberOfLines={1}>
              Uncrossed: Untangle Puzzle
            </Text>
            <Text style={styles.fallbackBody} numberOfLines={3}>
              Try a relaxing puzzle challenge from the same creator. Tap to open the Google Play Store.
            </Text>
          </View>
        </View>

        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>Open in Google Play</Text>
        </View>
      </Pressable>
    );
  }

  if (!nativeAd) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ad...</Text>
      </View>
    );
  }

  return (
    // NativeAdView acts as the root boundary for interaction tracking
    <NativeAdView nativeAd={nativeAd} style={styles.adContainer}>
      <View style={styles.headerRow}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <NativeAsset assetType={NativeAssetType.HEADLINE}>
          <Text style={styles.headline} numberOfLines={1}>
            {nativeAd.headline}
          </Text>
        </NativeAsset>
      </View>

      <NativeAsset assetType={NativeAssetType.BODY}>
        <Text style={styles.bodyText} numberOfLines={2}>
          {nativeAd.body}
        </Text>
      </NativeAsset>

      {/* NativeMediaView automatically handles rendering images OR video assets */}
      <NativeMediaView style={styles.mediaContainer} />

      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
        </View>
      </NativeAsset>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce6ef",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    color: "#4b5b6b",
    fontSize: 14,
    fontWeight: "600",
  },
  fallbackContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#dce6ef",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  fallbackHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fallbackLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },
  fallbackContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fallbackIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
  },
  fallbackTextColumn: {
    flex: 1,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2d3d",
    marginBottom: 6,
  },
  fallbackBody: {
    fontSize: 14,
    color: "#556677",
    lineHeight: 20,
  },
  adContainer: {
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  adBadge: { backgroundColor: "#FFD700", paddingHorizontal: 4, borderRadius: 3, marginRight: 8 },
  adBadgeText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  headline: { fontSize: 16, fontWeight: "bold", flex: 1 },
  bodyText: { fontSize: 14, color: "#555", marginBottom: 10 },
  mediaContainer: { width: "100%", height: 200, backgroundColor: "#f0f0f0", borderRadius: 8 },
  ctaButton: { marginTop: 12, backgroundColor: "#0055FF", padding: 12, borderRadius: 6, alignItems: "center" },
  ctaText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
});
