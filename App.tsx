import { useCallback, useEffect, useRef, useState } from "react"
import "react-native-gesture-handler"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import type { AppNavigation, RootStackParamList } from "./src/types/navigation"
import {
  View,
  StatusBar,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native"
import * as NavigationBar from "expo-navigation-bar"
import { Asset } from "expo-asset"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Ionicons from "@expo/vector-icons/Ionicons"
import PagerView from "react-native-pager-view"
import Home from "./src/screens/Home"
import PlanADate from "./src/screens/PlanADate"
import Info from "./src/screens/Info"
import DateIdeas from "./src/screens/DateIdeas"
import RecipesPage from "./src/screens/RecipesPage"
import RecipeDetail from "./src/screens/RecipeDetail"
import ActivityDetail from "./src/screens/ActivityDetail"
import InspectDateIdea from "./src/screens/InspectDateIdea"
import PlannedDateResults from "./src/screens/PlannedDateResults"
import SavedIdeas from "./src/screens/SavedIdeas"
import DateHistory from "src/screens/DateHistory"
import recipes from "./src/data/Recipes"

const Stack = createNativeStackNavigator<RootStackParamList>()

// Define tabs (order matters for swipe left/right)
const TABS = [
  {
    key: "Home",
    title: "Home",
    icon: "home",
    iconOutline: "home-outline",
    component: Home,
  },
  // {
  //   key: "Date Ideas",
  //   title: "Date Ideas",
  //   icon: "compass",
  //   iconOutline: "compass-outline",
  //   component: DateIdeas,
  // },
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
  // {
  //   key: "Info",
  //   title: "Info",
  //   icon: "information-circle",
  //   iconOutline: "information-circle-outline",
  //   component: Info,
  // },
]

export default function App() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden")
    NavigationBar.setBehaviorAsync("overlay-swipe")
  }, [])

  useEffect(() => {
    const recipeImages = recipes
      .map((recipe) => recipe.image)
      .filter((image): image is number => typeof image === "number")
    const uniqueRecipeImages = [...new Set(recipeImages)]

    // Warm the image cache so recipe thumbnails render quickly on first open.
    void Asset.loadAsync(uniqueRecipeImages)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Date Ideas" component={DateIdeas} />
          <Stack.Screen name="Date Planner" component={PlanADate} />
          <Stack.Screen name="Recipe Ideas" component={RecipesPage} />
          <Stack.Screen name="DateIdeas" component={DateIdeas} />
          <Stack.Screen name="PlanADate" component={PlanADate} />
          <Stack.Screen name="RecipesPage" component={RecipesPage} />
          <Stack.Screen name="SavedIdeas" component={SavedIdeas} />
          <Stack.Screen name="RecipeDetail" component={RecipeDetail} />
          <Stack.Screen name="ActivityDetail" component={ActivityDetail} />
          <Stack.Screen name="InspectDateIdea" component={InspectDateIdea} />
          <Stack.Screen
            name="PlannedDateResults"
            component={PlannedDateResults}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

function MainTabs({ navigation }: { navigation: AppNavigation }) {
  const pagerRef = useRef<PagerView | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position)
  }, [])

  const handleTabPress = useCallback((index: number) => {
    setCurrentPage(index)
    pagerRef.current?.setPage(index)
  }, [])

  const goToTab = useCallback((tabKey: string) => {
    const tabIndex = TABS.findIndex((tab) => tab.key === tabKey)
    if (tabIndex >= 0) {
      pagerRef.current?.setPage(tabIndex)
      setCurrentPage(tabIndex)
    }
  }, [])

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f6fb" />
      <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
        {/* Swipeable Pager for Tab Content */}
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={handlePageSelected}
          overdrag={true}
        >
          {TABS.map((tab, index) => {
            const Component = tab.component
            return (
              <View key={index} style={styles.page}>
                <Component navigation={navigation} goToTab={goToTab} />
              </View>
            )
          })}
        </PagerView>

        {/* Custom Bottom Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab, index) => {
            const isActive = currentPage === index
            const iconName = isActive ? tab.icon : tab.iconOutline
            const isCenterTab = tab.key === "Date Planner"
            const color = isActive ? "#1e90ff" : "#8e8e93"
            const centerButtonColor = isActive ? "#e63f67" : "#f05a7e"

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
                      ? [
                          styles.centerTabCircle,
                          { backgroundColor: centerButtonColor },
                        ]
                      : {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }
                  }
                >
                  <Ionicons
                    name={iconName as any}
                    size={isCenterTab ? 30 : 28}
                    color={isCenterTab ? "#ffffff" : color}
                  />
                  {/* <Text
                    style={
                      isCenterTab
                        ? styles.centerTabLabel
                        : [styles.tabLabel, { color }]
                    }
                  >
                    {tab.title}
                  </Text> */}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </>
  )
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
})
