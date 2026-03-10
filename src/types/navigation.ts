import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

export type PlannedDateResultsParams = {
  maxPrice: number;
  hasStarvingStudentCard: boolean;
  selectedDate: string;
  startHour: number;
  endHour: number;
  maxDistance: number;
  categories: string[];
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
  RecipeDetail: { index: number };
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export type AppScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;
