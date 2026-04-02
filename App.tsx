import { useCallback, useEffect, useRef, useState } from "react";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AppNavigation, RootStackParamList } from "./src/types/navigation";
import { View, StatusBar, TouchableOpacity, StyleSheet, Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { Asset } from "expo-asset";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import { initializeRevenueCat } from "./src/data/iapConfig";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import mobileAds from "react-native-google-mobile-ads";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    key: "Date Planner",
    title: "Date Planner",
    icon: "calendar",
    iconOutline: "calendar-outline",
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

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
    }
    mobileAds().initialize();
    initializeRevenueCat();
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
            <Stack.Screen name="Date Planner" component={PlanADate} />
            <Stack.Screen name="Recipe Ideas" component={RecipesPage} />
            <Stack.Screen name="PlanADate" component={PlanADate} />
            <Stack.Screen name="SavedIdeas" component={SavedIdeas} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetail} />
            <Stack.Screen name="ActivityDetail" component={ActivityDetail} />
            <Stack.Screen name="PlannedDateResults" component={PlannedDateResults} />
            <Stack.Screen name="DateCalendar" component={DateCalendar} />
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

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f6fb" />
      <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
        {/* Swipeable Pager for Tab Content */}
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

        {/* Custom Bottom Tab Bar */}
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
            const isCenterTab = tab.key === "Date Planner";
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
