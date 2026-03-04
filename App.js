import React from "react"
import "react-native-gesture-handler"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { View, StatusBar } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Ionicons } from "@expo/vector-icons"
import Home from "./src/screens/Home"
import Pages from "./src/Pages"
import DateIdeas from "./src/screens/DateIdeas"
import InspectDateIdea from "./src/screens/InspectDateIdea"
import PlanADate from "./src/screens/PlanADate"
import RecipesPage from "./src/screens/RecipesPage"
import RecipeDetail from "./src/screens/RecipeDetail"
import Clubs from "./src/screens/Clubs"
import EventsPage from "./src/screens/EventsPage"
import Tips from "./src/screens/Tips"
import Contact from "./src/screens/Contact"
import PlannedDateResults from "./src/screens/PlannedDateResults"
import Info from "./src/screens/Info"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} />
      <Stack.Screen name="DateIdeas" component={DateIdeas} />
      <Stack.Screen name="InspectDateIdea" component={InspectDateIdea} />
      <Stack.Screen name="Clubs" component={Clubs} />
      <Stack.Screen name="EventsPage" component={EventsPage} />
      <Stack.Screen name="RecipesPage" component={RecipesPage} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetail} />
      <Stack.Screen name="Contact" component={Contact} />
      <Stack.Screen name="Pages" component={Pages} />
    </Stack.Navigator>
  )
}

// Date Planner Stack Navigator
function PlannerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlanADateMain" component={PlanADate} />
      <Stack.Screen name="PlannedDateResults" component={PlannedDateResults} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f6fb" />
        <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              animationEnabled: true,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName

                if (route.name === "Home") {
                  iconName = focused ? "home" : "home-outline"
                } else if (route.name === "Date Planner") {
                  iconName = focused ? "calendar" : "calendar-outline"
                } else if (route.name === "Tips") {
                  iconName = focused ? "bulb" : "bulb-outline"
                } else if (route.name === "Info") {
                  iconName = focused
                    ? "information-circle"
                    : "information-circle-outline"
                }

                return <Ionicons name={iconName} size={size} color={color} />
              },
              tabBarActiveTintColor: "#1e90ff",
              tabBarInactiveTintColor: "#8e8e93",
              tabBarStyle: {
                backgroundColor: "#ffffff",
                borderTopWidth: 1,
                borderTopColor: "#e0e0e0",
                paddingBottom: 16,
                paddingTop: 8,
                height: 72,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: "600",
              },
            })}
            swipeEnabled={true}
            lazy={false}
          >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Date Planner" component={PlannerStack} />
            <Tab.Screen name="Tips" component={Tips} />
            <Tab.Screen name="Info" component={Info} />
          </Tab.Navigator>
        </View>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}
