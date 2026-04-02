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

export const CATEGORY_TYPE_MAP: Record<string, string[]> = {
  Food: ["cafe", "bakery", "ice_cream_shop", "dessert_restaurant", "coffee_shop", "pizza_restaurant", "sandwich_shop"],
  Sports: ["gym", "sports_club", "sports_complex", "golf_course", "tennis_court", "fitness_center", "yoga_studio"],
  Outdoors: ["park", "hiking_area", "nature_preserve", "mountain_peak", "campground", "scenic_spot", "lake", "river"],
  Education: ["museum", "library", "art_gallery", "science_center", "historic_site"],
  Shopping: ["shopping_mall", "clothing_store", "gift_shop", "toy_store", "book_store", "electronics_store"],
  Entertainment: ["movie_theater", "video_arcade", "amusement_park", "playground", "bowling_alley", "mini_golf", "concert_hall"],
};

export const DATE_CATEGORIES = ["Food", "Sports", "Outdoors", "Education", "Shopping", "Entertainment"] as const;

export type DateCategory = (typeof DATE_CATEGORIES)[number];
