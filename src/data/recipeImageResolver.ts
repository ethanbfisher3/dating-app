import type { ImageSourcePropType } from "react-native";

const FALLBACK_RECIPE_IMAGE: ImageSourcePropType = require("../assets/images/cooking.jpg");

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

    return FALLBACK_RECIPE_IMAGE;
  }

  return FALLBACK_RECIPE_IMAGE;
}
