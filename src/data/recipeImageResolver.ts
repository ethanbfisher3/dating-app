import type { ImageSourcePropType } from "react-native";

const FALLBACK_RECIPE_IMAGE: ImageSourcePropType = require("../assets/images/cooking.jpg");

// Map of recipe image filenames to their require() calls
const RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
  "avocado_toast.jpg": require("../assets/images/recipes/256/avocado_toast.jpg"),
  "baked_sweet_potato.jpg": require("../assets/images/recipes/256/baked_sweet_potato.jpg"),
  "banana_pancakes.jpg": require("../assets/images/recipes/256/banana_pancakes.jpg"),
  "bbq_chicken_sandwich.jpg": require("../assets/images/recipes/256/bbq_chicken_sandwich.jpg"),
  "bean_and_cheese_burrito.jpg": require("../assets/images/recipes/256/bean_and_cheese_burrito.jpg"),
  "blt.jpg": require("../assets/images/recipes/256/blt.jpg"),
  "breakfast_burrito.jpg": require("../assets/images/recipes/256/breakfast_burrito.jpg"),
  "brownies.jpg": require("../assets/images/recipes/256/brownies.jpg"),
  "buffalo_chicken_wrap.jpg": require("../assets/images/recipes/256/buffalo_chicken_wrap.jpg"),
  "caprese_salad.jpg": require("../assets/images/recipes/256/caprese_salad.jpg"),
  "cheesy_broccoli_rice.jpg": require("../assets/images/recipes/256/cheesy_broccoli_rice.jpg"),
  "cheesy_nachos.jpg": require("../assets/images/recipes/256/cheesy_nachos.jpg"),
  "cheesy_scrambled_eggs.jpg": require("../assets/images/recipes/256/cheesy_scrambled_eggs.jpg"),
  "chicken_alfredo.jpg": require("../assets/images/recipes/256/chicken_alfredo.jpg"),
  "chicken_caesar_wrap.jpg": require("../assets/images/recipes/256/chicken_caesar_wrap.jpg"),
  "chicken_rice_soup.jpg": require("../assets/images/recipes/256/chicken_rice_soup.jpg"),
  "chicken_taco.jpg": require("../assets/images/recipes/256/chicken_taco.jpg"),
  "chickpea_salad.jpg": require("../assets/images/recipes/256/chickpea_salad.jpg"),
  "chocolate-covered-bananas.jpg": require("../assets/images/recipes/256/chocolate-covered-bananas.jpg"),
  "chocolate_mug_cake.jpg": require("../assets/images/recipes/256/chocolate_mug_cake.jpg"),
  "chocolate_strawberries.jpg": require("../assets/images/recipes/256/chocolate_strawberries.jpg"),
  "cinnamon_apples.jpg": require("../assets/images/recipes/256/cinnamon_apples.jpg"),
  "cinnamon_doughnuts.jpg": require("../assets/images/recipes/256/cinnamon_doughnuts.jpg"),
  "cinnamon_toast.jpg": require("../assets/images/recipes/256/cinnamon_toast.jpg"),
  "cucumber_sandwiches.jpg": require("../assets/images/recipes/256/cucumber_sandwiches.jpg"),
  "egg_salad_sandwich.jpg": require("../assets/images/recipes/256/egg_salad_sandwich.jpg"),
  "eggs_beans_salsa.jpg": require("../assets/images/recipes/256/eggs_beans_salsa.jpg"),
  "fajitas.jpg": require("../assets/images/recipes/256/fajitas.jpg"),
  "fried_rice.jpg": require("../assets/images/recipes/256/fried_rice.jpg"),
  "garlic_bread.jpg": require("../assets/images/recipes/256/garlic_bread.jpg"),
  "garlic_butter_noodles.jpg": require("../assets/images/recipes/256/garlic_butter_noodles.jpg"),
  "garlic_roasted_vegetables.jpg": require("../assets/images/recipes/256/garlic_roasted_vegetables.jpg"),
  "greek_yogurt_parfait.jpg": require("../assets/images/recipes/256/greek_yogurt_parfait.jpg"),
  "grilled_cheese.jpg": require("../assets/images/recipes/256/grilled_cheese.jpg"),
  "ham_and_cheese_burrito.jpg": require("../assets/images/recipes/256/ham_and_cheese_burrito.jpg"),
  "ham_breakfast_scramble.jpg": require("../assets/images/recipes/256/ham_breakfast_scramble.jpg"),
  "no_bake_cheesecake.jpg": require("../assets/images/recipes/256/no_bake_cheesecake.jpg"),
  "omelette.jpg": require("../assets/images/recipes/256/omelette.jpg"),
  "peanut_butter_banana_toast.jpg": require("../assets/images/recipes/256/peanut_butter_banana_toast.jpg"),
  "peanut_butter_cookies.jpg": require("../assets/images/recipes/256/peanut_butter_cookies.jpg"),
  "pita_pizzas.jpg": require("../assets/images/recipes/256/pita_pizzas.jpg"),
  "quesadilla.jpg": require("../assets/images/recipes/256/quesadilla.jpg"),
  "rice_krispie_treats.jpg": require("../assets/images/recipes/256/rice_krispie_treats.jpg"),
  "simple_sliders.jpg": require("../assets/images/recipes/256/simple_sliders.jpg"),
  "sloppy_joe.jpg": require("../assets/images/recipes/256/sloppy_joe.jpg"),
  "smoothie.jpg": require("../assets/images/recipes/256/smoothie.jpg"),
  "smores_bar.jpg": require("../assets/images/recipes/256/smores_bar.jpg"),
  "spaghetti.jpg": require("../assets/images/recipes/256/spaghetti.jpg"),
  "stir_fry.jpg": require("../assets/images/recipes/256/stir_fry.jpg"),
  "stuffed_peppers.jpg": require("../assets/images/recipes/256/stuffed_peppers.jpg"),
  "taco_salad.jpg": require("../assets/images/recipes/256/taco_salad.jpg"),
  "teriyaki_chicken.jpg": require("../assets/images/recipes/256/teriyaki_chicken.jpg"),
  "tuna_salad.jpg": require("../assets/images/recipes/256/tuna_salad.jpg"),
  "turkey_sandwich.jpg": require("../assets/images/recipes/256/turkey_sandwich.jpg"),
  "veggie_omelette.jpg": require("../assets/images/recipes/256/veggie_omelette.jpg"),
  "zucchini_fritters.jpg": require("../assets/images/recipes/256/zucchini_fritters.jpg"),
};

function normalizeRecipeImageKey(imagePath: string): string {
  return imagePath.replace(/\\/g, "/").replace(/^\.\.\/assets\/images\//, "");
}

export function resolveRecipeImage(image: unknown): ImageSourcePropType {
  if (typeof image === "number") {
    return image as ImageSourcePropType;
  }

  if (image && typeof image === "object" && "uri" in (image as Record<string, unknown>)) {
    return image as ImageSourcePropType;
  }

  if (typeof image === "string") {
    const normalized = normalizeRecipeImageKey(image);

    if (/^https?:\/\//i.test(normalized)) {
      return { uri: normalized } as ImageSourcePropType;
    }

    // Handle local recipe image paths like "recipes/256/filename.jpg"
    if (normalized.startsWith("recipes/256/")) {
      const filename = normalized.replace("recipes/256/", "");
      return RECIPE_IMAGES[filename] || FALLBACK_RECIPE_IMAGE;
    }

    return FALLBACK_RECIPE_IMAGE;
  }

  return FALLBACK_RECIPE_IMAGE;
}
