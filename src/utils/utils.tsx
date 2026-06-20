import { Alert, BackHandler, Linking, Platform } from "react-native";

export function sanitizeUri(uri: string) {
  if (!uri) return null;
  let u = String(uri);
  // remove template markers like ${process.env.PUBLIC_URL}
  u = u.replace(/\$\{process\.env\.PUBLIC_URL\}/g, "");
  u = u.replace(/^undefined/, "");
  u = u.trim();
  if (!u) return null;
  // If relative path starting with /images, leave it — DateIdeaBox will handle remote fallback
  return u;
}

export const openWebsite = async (url: string) => {
  try {
    // Check if the URL can be opened
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open the website.");
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong while opening the website.");
    return;
  }

  // Exit app only on Android
  if (Platform.OS === "android") {
    BackHandler.exitApp();
  }
};

export const timesAreInvalid = (startHour12: string, endHour12: string, startPeriod: string, endPeriod: string) => {
  var startHour = parseInt(startHour12);
  var endHour = parseInt(endHour12);
  if (startHour < 1 || startHour > 12 || endHour < 1 || endHour > 12) {
    return true;
  }
  if (startPeriod === "PM" && startHour !== 12) {
    startHour += 12;
  } else if (startPeriod === "AM" && startHour === 12) {
    startHour = 0;
  }
  if (endPeriod === "PM" && endHour !== 12) {
    endHour += 12;
  } else if (endPeriod === "AM" && endHour === 12) {
    endHour = 0;
  }
  return startHour >= endHour;
};

export const SLOT_TO_PLACE_TYPES: Record<string, string[]> = {
  // Food — each maps only to itself so templates stay specific
  restaurant: ["restaurant"],
  fast_food: ["fast_food"],
  cafe: ["cafe"],
  ice_cream: ["ice_cream"],
  food_court: ["food_court"],

  // Outdoors — each maps only to itself
  park: ["park"],
  garden: ["garden"],
  nature_reserve: ["nature_reserve"],
  viewpoint: ["viewpoint"],
  picnic_site: ["picnic_site"],
  recreation_ground: ["recreation_ground"],
  dog_park: ["dog_park"],
  camp_site: ["camp_site"],

  // Sports — specific types
  fitness_centre: ["fitness_centre", "gym"],
  gym: ["fitness_centre", "gym"],
  swimming_pool: ["swimming_pool"],
  ice_rink: ["ice_rink"],
  sports_centre: ["sports_centre"],
  tennis: ["tennis"],
  golf: ["golf", "golf_course"],

  // Education — each maps only to itself
  museum: ["museum"],
  art_gallery: ["art_gallery"],
  library: ["library"],
  historic: ["historic"],

  // Shopping — each maps only to itself
  mall: ["mall", "department_store"],
  clothes: ["clothes"],
  books: ["books"],
  gift: ["gift"],
  toys: ["toys"],
  electronics: ["electronics"],

  // Entertainment — each maps only to itself
  cinema: ["cinema"],
  bowling_alley: ["bowling_alley"],
  miniature_golf: ["miniature_golf"],
  amusement_arcade: ["amusement_arcade"],
  theme_park: ["theme_park"],
};

export const DATE_CATEGORIES = ["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"] as const;

export type DateCategory = (typeof DATE_CATEGORIES)[number];

export const SLOT_TO_CATEGORY: Record<string, string> = {
  restaurant: "Food",
  fast_food: "Food",
  cafe: "Food",
  food_court: "Food",
  ice_cream: "Food",
  recipe: "Food",
  dessert: "Food",
  meal: "Food",
  park: "Outdoors",
  garden: "Outdoors",
  nature_reserve: "Outdoors",
  recreation_ground: "Outdoors",
  dog_park: "Outdoors",
  viewpoint: "Outdoors",
  picnic_site: "Outdoors",
  camp_site: "Outdoors",
  pitch: "Outdoors",
  leisure: "Outdoors",
  sport: "Sports",
  tennis: "Sports",
  golf: "Sports",
  fitness: "Sports",
  yoga: "Sports",
  museum: "Education",
  art_gallery: "Education",
  library: "Education",
  historic: "Education",
  tourism: "Education",
  learningSpot: "Education",
  mall: "Shopping",
  shop: "Shopping",
  clothes: "Shopping",
  gift: "Shopping",
  toys: "Shopping",
  books: "Shopping",
  electronics: "Shopping",
  cinema: "Entertainment",
  amusement_arcade: "Entertainment",
  theme_park: "Entertainment",
  playground: "Entertainment",
  bowling_alley: "Entertainment",
  miniature_golf: "Entertainment",
  activityPlace: "Entertainment",
  fitness_centre: "Sports",
  gym: "Sports",
  sports_centre: "Sports",
  swimming_pool: "Sports",
  ice_rink: "Sports",
};
