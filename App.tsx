import { useCallback, useEffect, useRef, useState } from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppNavigation, RootStackParamList } from "./src/types/navigation";
import { View, StatusBar, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { Asset } from "expo-asset";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import PagerView from "react-native-pager-view";
import Home from "./src/screens/Home";
import PlanADate from "./src/screens/PlanADate";
import RecipesPage from "./src/screens/RecipesPage";
import RecipeDetail from "./src/screens/RecipeDetail";
import ActivityDetail from "./src/screens/ActivityDetail";
import PlannedDateResults from "./src/screens/PlannedDateResults";
import SavedIdeas from "./src/screens/SavedIdeas";
import DateHistory from "./src/screens/DateHistory";
import DateCalendar from "./src/screens/DateCalendar";
import SwipeIdeas from "./src/screens/SwipeIdeas";
import recipes from "./src/data/Recipes";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import mobileAds from "react-native-google-mobile-ads";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import BottomBackgroundArt from "./src/Components/BottomBackgroundArt";
import Text from "./src/Components/AppText";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator<RootStackParamList>();
const EDGE_SWIPE_WIDTH = 28;
const SWIPE_BACK_DISTANCE = 70;
const SWIPE_BACK_VELOCITY = 600;
const TABS = [
  {
    key: "Home",
    title: "Home",
    icon: "home",
    iconOutline: "home-outline",
    component: Home,
  },
  {
    key: "Date History",
    title: "History",
    icon: "time",
    iconOutline: "time-outline",
    component: DateHistory,
  },
  {
    key: "DateCraft",
    title: "Ideas",
    icon: "bulb",
    iconOutline: "bulb-outline",
    component: PlanADate,
  },
  {
    key: "SwipeIdeas",
    title: "Discover",
    icon: "heart-circle",
    iconOutline: "heart-circle-outline",
    component: SwipeIdeas,
  },
  {
    key: "Recipe Ideas",
    title: "Recipes",
    icon: "restaurant",
    iconOutline: "restaurant-outline",
    component: RecipesPage,
  },
];

function SwipeBackLayout({ navigation, children }: { navigation: AppNavigation; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  const handleStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.state !== State.END) {
        return;
      }

      const { translationX, velocityX } = event.nativeEvent;
      const movedFarEnough = translationX > SWIPE_BACK_DISTANCE;
      const movedFastEnough = velocityX > SWIPE_BACK_VELOCITY;

      if ((movedFarEnough || movedFastEnough) && navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation],
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <BottomBackgroundArt bottomOffset={0} />
      {children}
      {navigation.canGoBack() && (
        <>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              zIndex: 10,
              backgroundColor: "rgba(255,255,255,0.85)",
              borderRadius: 20,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <PanGestureHandler activeOffsetX={[-10, 10]} failOffsetY={[-15, 15]} onHandlerStateChange={handleStateChange}>
            <View
              collapsable={false}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: EDGE_SWIPE_WIDTH,
              }}
            />
          </PanGestureHandler>
        </>
      )}
    </View>
  );
}

export default function App() {
  const appStartRef = useRef(Date.now());

  const [loaded, error] = useFonts({
    SuperMindset: require("./src/assets/fonts/SuperMindset.ttf"),
    SuperPandora: require("./src/assets/fonts/SuperPandora.ttf"),
    MatchaCih: require("./src/assets/fonts/MatchaCih.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      const elapsed = Date.now() - appStartRef.current;
      const remaining = Math.max(0, 2000 - elapsed);
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [loaded, error]);

  useEffect(() => {
    async function init() {
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("hidden");
      } else if (Platform.OS === "ios") {
        await requestTrackingPermissionsAsync();
      }
      mobileAds().initialize();
    }
    void init();
    const recipeImages = recipes.map((recipe) => recipe.image).filter((image): image is number => typeof image === "number");
    const uniqueRecipeImages = [...new Set(recipeImages)];

    void Asset.loadAsync(uniqueRecipeImages);
  }, []);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: "#fafbfc" }, headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="DateCraft">
              {({ navigation }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <PlanADate navigation={navigation as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="Recipe Ideas">
              {({ navigation }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <RecipesPage navigation={navigation as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="PlanADate">
              {({ navigation }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <PlanADate navigation={navigation as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="SavedIdeas">
              {({ navigation }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <SavedIdeas navigation={navigation as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="RecipeDetail">
              {({ navigation, route }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <RecipeDetail navigation={navigation as any} route={route as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="ActivityDetail">
              {({ navigation, route }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <ActivityDetail navigation={navigation as any} route={route as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="PlannedDateResults">
              {({ navigation, route }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <PlannedDateResults navigation={navigation as any} route={route as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
            <Stack.Screen name="DateCalendar">
              {({ navigation }) => (
                <SwipeBackLayout navigation={navigation as any}>
                  <DateCalendar navigation={navigation as any} />
                </SwipeBackLayout>
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function MainTabs({ navigation }: { navigation: AppNavigation }) {
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? insets.bottom : 0;
  const pagerRef = useRef<PagerView | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const tabAnimation = useRef(new Animated.Value(0)).current;
  const pressFade = useRef(new Animated.Value(1)).current;
  // tab bounce removed — only keep circle indicator
  const [isSwiping, setIsSwiping] = useState(false);
  const [cardSwiping, setCardSwiping] = useState(false);
  const [tabColors, setTabColors] = useState<string[]>(TABS.map(() => "#8e8e93"));

  const handlePageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      setCurrentPage(position);
      tabAnimation.setValue(position);
      setIsSwiping(false);
    },
    [tabAnimation],
  );

  const handlePageScroll = useCallback(
    (e: any) => {
      tabAnimation.setValue(e.nativeEvent.position + e.nativeEvent.offset);
      setIsSwiping(true);
    },
    [tabAnimation],
  );

  const handleTabPress = useCallback(
    (index: number) => {
      setCurrentPage(index);
      // Jump immediately to the target index, but fade the indicator in
      // so it doesn't appear on intermediate tabs.
      pressFade.setValue(0);
      tabAnimation.setValue(index);
      Animated.timing(pressFade, {
        toValue: 1,
        duration: 180,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      pagerRef.current?.setPageWithoutAnimation(index);
    },
    [tabAnimation],
  );

  useEffect(() => {
    // Update tab colors smoothly based on tabAnimation value.
    function hexToRgb(hex: string) {
      const clean = hex.replace("#", "");
      const bigint = parseInt(clean, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    function rgbToHex(r: number, g: number, b: number) {
      return (
        "#" +
        [r, g, b]
          .map((v) =>
            Math.max(0, Math.min(255, Math.round(v)))
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
      );
    }

    function lerpHex(a: string, b: string, t: number) {
      const ra = hexToRgb(a);
      const rb = hexToRgb(b);
      const rr = ra.map((v, i) => v + (rb[i] - v) * t);
      return rgbToHex(rr[0], rr[1], rr[2]);
    }

    const id = tabAnimation.addListener(({ value }) => {
      const newColors = TABS.map((_, i) => {
        const t = 1 - Math.min(Math.abs(value - i), 1);
        return lerpHex("#8e8e93", "#ffffff", t);
      });
      setTabColors(newColors);
    });

    return () => {
      try {
        tabAnimation.removeListener(id);
      } catch {}
    };
  }, [tabAnimation]);

  // bounce effect removed

  const goToTab = useCallback((tabKey: string) => {
    const tabIndex = TABS.findIndex((tab) => tab.key === tabKey);
    if (tabIndex >= 0) {
      pagerRef.current?.setPage(tabIndex);
      setCurrentPage(tabIndex);
    }
  }, []);


  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f6fb" />
      <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={handlePageSelected}
          onPageScroll={handlePageScroll}
          overdrag={true}
          scrollEnabled={!cardSwiping}
        >
          {TABS.map((tab, index) => {
            const Component = tab.component;
            return (
              <View key={index} style={styles.page}>
                <BottomBackgroundArt bottomOffset={0} />
                <View style={styles.pageContent}>
                  {tab.key === "SwipeIdeas" ? (
                    <SwipeIdeas navigation={navigation} goToTab={goToTab} onCardSwipeActive={setCardSwiping} />
                  ) : (
                    <Component navigation={navigation} goToTab={goToTab} />
                  )}
                </View>
              </View>
            );
          })}
        </PagerView>

        <View
          style={[
            styles.tabBar,
            {
              paddingBottom: androidBottomInset || 12,
              paddingTop: 0,
              height: 72 + androidBottomInset,
            },
          ]}
        >
          {TABS.map((tab, index) => {
            const isActive = currentPage === index;
            const iconName = isActive ? tab.icon : tab.iconOutline;
            const color = isActive ? "#ffffff" : "#8e8e93";
            const inputRange = [index - 1, index, index + 1];
            const indicatorScale = tabAnimation.interpolate({
              inputRange,
              outputRange: [0.9, 1, 0.9],
              extrapolate: "clamp",
            });
            const indicatorOpacity = tabAnimation.interpolate({
              inputRange,
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            });
            const indicatorCompositeOpacity = isSwiping ? 0 : Animated.multiply(indicatorOpacity, pressFade);

            // Colors are driven via `tabColors` (updated by a listener)
            const bounceTranslateY = 0;

            return (
              <TouchableOpacity key={tab.key} style={styles.tabButton} onPress={() => handleTabPress(index)} activeOpacity={0.7}>
                <Animated.View
                  style={[
                    styles.tabItem,
                    {
                      transform: [{ translateY: bounceTranslateY as any }],
                    },
                  ]}
                >
                  <Ionicons name={iconName as any} size={28} color={isActive ? "#007AFF" : (tabColors[index] ?? color)} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? "#007AFF" : (tabColors[index] ?? color),
                      },
                    ]}
                  >
                    {tab.title}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  pageContent: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    zIndex: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
    zIndex: 1,
  },
  tabIndicator: {
    position: "absolute",
    top: -8,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#f05a7e",
    shadowColor: "#f05a7e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 0,
    textAlign: "center",
  },
});
