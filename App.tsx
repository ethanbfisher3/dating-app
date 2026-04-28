import { useCallback, useEffect, useRef, useState } from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppNavigation, RootStackParamList } from "./src/types/navigation";
import { AppState, View, StatusBar, TouchableOpacity, StyleSheet, Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as Location from "expo-location";
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
import recipes from "./src/data/Recipes";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import mobileAds from "react-native-google-mobile-ads";
import { DATE_CATEGORIES } from "./src/utils/utils";
import {fetchPlacesFromOverpassWithCache} from "./src/hooks/usePlacesActivitiesRecipes";
import { initializeOverpassPlacesStore } from "./src/data/overpassPlacesStore";

const Stack = createNativeStackNavigator<RootStackParamList>();
const EDGE_SWIPE_WIDTH = 28;
const SWIPE_BACK_DISTANCE = 70;
const SWIPE_BACK_VELOCITY = 600;
const OVERPASS_WARMUP_INTERVAL_MS = 5 * 60 * 1000;

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
    title: "Date History",
    icon: "time",
    iconOutline: "time-outline",
    component: DateHistory,
  },
  {
    key: "DateCraft",
    title: "DateCraft",
    icon: "bulb",
    iconOutline: "bulb-outline",
    component: PlanADate,
  },
  {
    key: "Recipe Ideas",
    title: "Recipe Ideas",
    icon: "restaurant",
    iconOutline: "restaurant-outline",
    component: RecipesPage,
  },
  {
    key: "Saved Ideas",
    title: "Saved Ideas",
    icon: "bookmark",
    iconOutline: "bookmark-outline",
    component: SavedIdeas,
  },
];

function SwipeBackLayout({ navigation, children }: { navigation: AppNavigation; children: React.ReactNode }) {
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
    <View style={{ flex: 1 }}>
      {children}
      {navigation.canGoBack() && (
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
      )}
    </View>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
    }
    mobileAds().initialize();
    void initializeOverpassPlacesStore();
    const recipeImages = recipes.map((recipe) => recipe.image).filter((image): image is number => typeof image === "number");
    const uniqueRecipeImages = [...new Set(recipeImages)];

    void Asset.loadAsync(uniqueRecipeImages);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
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
  const warmupInFlightRef = useRef<Promise<void> | null>(null);
  const warmupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handleTabPress = useCallback((index: number) => {
    setCurrentPage(index);
    pagerRef.current?.setPage(index);
  }, []);

  const goToTab = useCallback((tabKey: string) => {
    const tabIndex = TABS.findIndex((tab) => tab.key === tabKey);
    if (tabIndex >= 0) {
      pagerRef.current?.setPage(tabIndex);
      setCurrentPage(tabIndex);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const warmUpNearbyPlaces = async (trigger: string) => {
      if (warmupInFlightRef.current) {
        return warmupInFlightRef.current;
      }

      const warmupPromise = (async () => {
        try {
          const lastKnownPosition = await Location.getLastKnownPositionAsync();
          if (lastKnownPosition && !cancelled) {
            await fetchPlacesFromOverpassWithCache({
              maxPrice: 9999,
              selectedDate: new Date().toISOString().slice(0, 10),
              startHour: 0,
              endHour: 23,
              dateLengthMinutes: 24 * 60,
              maxDistance: 25,
              categories: [...DATE_CATEGORIES],
              serverTarget: "overpass",
              userLocation: {
                latitude: lastKnownPosition.coords.latitude,
                longitude: lastKnownPosition.coords.longitude,
              },
            });
            return;
          }

          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted" || cancelled) {
            return;
          }

          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (cancelled) {
            return;
          }

          await fetchPlacesFromOverpassWithCache({
            maxPrice: 9999,
            selectedDate: new Date().toISOString().slice(0, 10),
            startHour: 0,
            endHour: 23,
            dateLengthMinutes: 24 * 60,
            maxDistance: 25,
            categories: [...DATE_CATEGORIES],
            serverTarget: "overpass",
            userLocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        } catch {
        }
      })();

      warmupInFlightRef.current = warmupPromise;

      try {
        await warmupPromise;
      } finally {
        warmupInFlightRef.current = null;
      }
    };

    const scheduleWarmup = (trigger: string) => {
      void warmUpNearbyPlaces(trigger);
    };

    scheduleWarmup("mount");

    warmupTimerRef.current = setInterval(() => {
      if (AppState.currentState === "active") {
        scheduleWarmup("interval");
      }
    }, OVERPASS_WARMUP_INTERVAL_MS);

    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (previousAppState.match(/inactive|background/) && nextAppState === "active") {
        scheduleWarmup("app-active");
      }
    });

    return () => {
      cancelled = true;
      appStateSubscription.remove();

      if (warmupTimerRef.current) {
        clearInterval(warmupTimerRef.current);
        warmupTimerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f6fb" />
      <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
        <PagerView ref={pagerRef} style={styles.pager} initialPage={0} onPageSelected={handlePageSelected} overdrag={true}>
          {TABS.map((tab, index) => {
            const Component = tab.component;
            return (
              <View key={index} style={styles.page}>
                <Component navigation={navigation} goToTab={goToTab} />
              </View>
            );
          })}
        </PagerView>

        <View
          style={[
            styles.tabBar,
            {
              paddingBottom: 12 + androidBottomInset,
              height: 72 + androidBottomInset,
            },
          ]}
        >
          {TABS.map((tab, index) => {
            const isActive = currentPage === index;
            const iconName = isActive ? tab.icon : tab.iconOutline;
            const isCenterTab = tab.key === "DateCraft";
            const color = isActive ? "#1e90ff" : "#8e8e93";
            const centerButtonColor = isActive ? "#e63f67" : "#f05a7e";

            return (
              <TouchableOpacity
                key={tab.key}
                style={isCenterTab ? styles.centerTabButton : styles.tabButton}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                <View
                  style={
                    isCenterTab
                      ? [styles.centerTabCircle, { backgroundColor: centerButtonColor }]
                      : {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }
                  }
                >
                  <Ionicons name={iconName as any} size={isCenterTab ? 30 : 28} color={isCenterTab ? "#ffffff" : color} />
                </View>
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
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: 12,
    paddingTop: 8,
    height: 72,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  centerTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerTabCircle: {
    width: 72,
    height: 72,
    borderRadius: 44,
    marginTop: -16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  centerTabLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    color: "#ffffff",
    textAlign: "center",
  },
});
