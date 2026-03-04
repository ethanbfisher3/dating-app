import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaView, StatusBar } from "react-native"
import Home from "./src/Home"
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
import Layout from "./src/Components/Layout"

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}
        >
          {/** wrap each screen component with Layout so header/footer are present */}
          <Stack.Screen
            name="Home"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <Home {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="Pages"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <Pages {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="DateIdeas"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <DateIdeas {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="InspectDateIdea"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <InspectDateIdea {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="PlanADate"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <PlanADate {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="PlannedDateResults"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <PlannedDateResults {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="Tips"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <Tips {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="Contact"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <Contact {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="EventsPage"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <EventsPage {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="RecipesPage"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <RecipesPage {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="RecipeDetail"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <RecipeDetail {...props} />
              </Layout>
            )}
          />
          <Stack.Screen
            name="Clubs"
            component={(props) => (
              <Layout navigation={props.navigation}>
                <Clubs {...props} />
              </Layout>
            )}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  )
}
