import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";

export type PlannedDateResultsParams = {
  maxPrice: number;
  selectedDate: string;
  startHour: number;
  endHour: number;
  dateLengthMinutes: number;
  maxDistance: number;
  categories: string[];
  serverTarget: string;
  userLocation?: UserLocationParams | null;
};

export type UserLocationParams = {
  latitude: number;
  longitude: number;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Info: undefined;
  Tips: undefined;
  SavedIdeas: undefined;
  Contact: undefined;
  Clubs: undefined;
  EventsPage: undefined;
  "Date Ideas": undefined;
  "Date Planner": undefined;
  "Recipe Ideas": undefined;
  DateIdeas: undefined;
  PlanADate: undefined;
  RecipesPage: undefined;
  InspectDateIdea: {
    id: number | string;
    userLocation?: UserLocationParams | null;
  };
  PlannedDateResults: PlannedDateResultsParams;
  DateCalendar: undefined;
  RecipeDetail: { index: number };
  ActivityDetail: { id: string };
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export type AppScreenProps<RouteName extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, RouteName>;
