export default {
  expo: {
    name: "DateCraft: Date Planner",
    slug: "byu-dating-native",
    version: "1.0.0",
    icon: "./src/assets/images/date_planner_icon.png",
    backgroundColor: "#FFFFFF",

    splash: {
      backgroundColor: "#FFFFFF",
      image: "./src/assets/images/date_planner_icon.png",
    },

    android: {
      package: "com.ethanbfisher3.dateplanner",
    },

    ios: {
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
        NSLocalNetworkUsageDescription: "Allow local network access to connect to your nearby date planning server during development.",
      },
    },

    extra: {
      revenueCatApiKeyApple: process.env.REVENUECAT_API_KEY_APPLE,
      revenueCatApiKeyGoogle: process.env.REVENUECAT_API_KEY_GOOGLE,
      revenueCatApiKeyTestStore: process.env.REVENUECAT_API_KEY_TEST_STORE,
      eas: {
        projectId: "acb92048-fe7c-4b07-a0ed-d40443ef8df0",
      },
    },

    plugins: [
      "expo-font",
      "expo-asset",
      "@react-native-community/datetimepicker",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-9592701510571371~4266549309",
          iosAppId: "ca-app-pub-9592701510571371~1448814278",
          userTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you.",
        },
      ],
      "expo-video",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
  },
};
