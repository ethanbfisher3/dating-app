// Mapping of image paths (relative under public/images) to bundled requires.
// After you copy the original `public/images` into `assets/images` (see README),
// Metro will be able to resolve these require() calls.

const map = {
  "date_ideas/farmers_market.png": require("../../assets/images/date_ideas/farmers_market.png"),
  "date_ideas/pickleball.png": require("../../assets/images/date_ideas/pickleball.png"),
  "date_ideas/walk_or_hike.png": require("../../assets/images/date_ideas/walk_or_hike.png"),
  "date_ideas/cook.png": require("../../assets/images/date_ideas/cook.png"),
  "date_ideas/ice_skating.png": require("../../assets/images/date_ideas/ice_skating.png"),
  "date_ideas/go_kart.png": require("../../assets/images/date_ideas/go_kart.png"),
  "date_ideas/museum.png": require("../../assets/images/date_ideas/museum.png"),
  "date_ideas/picnic.png": require("../../assets/images/date_ideas/picnic.png"),
  "date_ideas/shopping.png": require("../../assets/images/date_ideas/shopping.png"),
  "date_ideas/downtown_provo.png": require("../../assets/images/date_ideas/downtown_provo.png"),

  // recipes
  "recipes/avocado_toast.png": require("../../assets/images/recipes/avocado_toast.png"),
  "recipes/baked_sweet_potato.png": require("../../assets/images/recipes/baked_sweet_potato.png"),
  "recipes/banana_pancakes.png": require("../../assets/images/recipes/banana_pancakes.png"),
  "recipes/blt.png": require("../../assets/images/recipes/blt.png"),
  // (Many more recipe images exist in the original; add as needed)

  // root images
  "buff_guy.png": require("../../assets/images/buff_guy.png"),
  "group_activity.png": require("../../assets/images/group_activity.png"),
  "home_background.png": require("../../assets/images/home_background.png"),
  "ssc.png": require("../../assets/images/ssc.png"),
}

export default map

export function findAssetForPath(path) {
  if (!path) return null
  const p = path.toString()
  for (const key of Object.keys(map)) {
    if (p.includes(key)) return map[key]
  }
  return null
}
