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
  restaurant: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  fast_food: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  cafe: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  food_court: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  ice_cream: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  tennis: ["tennis", "golf", "fitness", "yoga"],
  golf: ["tennis", "golf", "fitness", "yoga"],
  fitness: ["tennis", "golf", "fitness", "yoga"],
  yoga: ["tennis", "golf", "fitness", "yoga"],
  park: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  garden: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  nature_reserve: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  recreation_ground: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  dog_park: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  viewpoint: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  picnic_site: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  camp_site: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  pitch: ["park", "garden", "nature_reserve", "recreation_ground", "dog_park", "viewpoint", "picnic_site", "camp_site", "pitch"],
  museum: ["museum", "art_gallery", "library", "historic"],
  art_gallery: ["museum", "art_gallery", "library", "historic"],
  library: ["museum", "art_gallery", "library", "historic"],
  historic: ["museum", "art_gallery", "library", "historic"],
  mall: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  clothes: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  gift: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  toys: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  books: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  electronics: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  cinema: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
  amusement_arcade: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
  theme_park: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
  playground: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
  bowling_alley: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
  miniature_golf: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
  meal: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  dessert: ["restaurant", "fast_food", "cafe", "food_court", "ice_cream"],
  shop: ["mall", "clothes", "gift", "toys", "books", "electronics"],
  learningSpot: ["museum", "art_gallery", "library", "historic"],
  activityPlace: ["cinema", "amusement_arcade", "theme_park", "playground", "bowling_alley", "miniature_golf"],
};

export const DATE_CATEGORIES = ["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"] as const;

export type DateCategory = (typeof DATE_CATEGORIES)[number];
