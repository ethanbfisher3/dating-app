import config from "../config"

export const getBackgroundColorFromBaddyProbability = (baddyProbability) => {
  return config.invertedColors ? "var(--byu-light-blue)" : "var(--byu-blue)"
}

export const getLikelinessFromBaddyProbability = (baddyProbability) => {
  if (baddyProbability >= 0.8) return "Very likely to find a girl"
  if (baddyProbability >= 0.6) return "Likely to find a girl"
  if (baddyProbability >= 0.4) return "Possible to find a girl"
  return "Unlikely to find a girl"
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getBaddyProbability = (event) => {
  var probability = 0.2

  const categoryName = event.CategoryName
    ? event.CategoryName.toLowerCase()
    : ""
  const description = event.Description ? event.Description.toLowerCase() : ""
  const title = event.Title ? event.Title.toLowerCase() : ""

  const match = (string, substring) => {
    substring = substring.toLowerCase()
    const regex = new RegExp(substring, "g")
    return (string.match(regex) || []).length
  }

  const includesText = (text, amount = 1) => {
    return (
      match(categoryName, text) +
        match(description, text) +
        match(title, text) >=
      amount
    )
  }

  const includesTexts = (texts, totalAmount) => {
    return (
      texts.reduce(
        (acc, text) =>
          acc +
          match(categoryName, text) +
          match(description, text) +
          match(title, text),
        0
      ) >= totalAmount
    )
  }

  if (includesText("clubs night")) return 0.84
  if (includesText("cougar skate")) return 0.91
  if (includesText("classic film")) return 0.62
  if (includesText("dance", 3)) return 0.89
  if (includesText("etiquette dinner")) return 0.81
  if (includesTexts(["healthy", "snack", "diet"], 4)) return 0.77
  if (includesText("ballet", 3)) return 0.68
  if (includesText("craft", 3)) return 0.59
  if (includesText("women", 4)) return 0.71
  if (includesText("surf", 3)) return 0.46
  if (includesText("trick or treat")) return 0.9

  if (includesText("stem")) probability -= 0.3
  if (includesText("film", 2) || includesText("cinem", 2)) probability -= 0.02

  if ((includesText("dancesport"), 2)) probability += 0.1
  if (includesText("sketch")) probability += 0.45
  if (includesText("fhe")) probability += 0.4
  if (includesText("fair")) probability += 0.5
  if (includesText("football")) probability += 0.02
  if (includesText("cook") || includesText("diet")) probability += 0.1
  if (includesText("nature")) probability += 0.03
  if (includesText("music")) probability += 0.05
  if (title.includes("homecoming")) probability += 0.99
  if (includesTexts(["party", "costume", "bash", "ticket"], 5))
    probability += 0.5
  if (
    title.includes("men's") &&
    !title.includes("women's") &&
    !title.includes("football") &&
    !title.includes("basketball")
  )
    probability -= 0.5
  else if (title.includes("football")) return 0.95
  return clamp(probability, 0.33, 0.99)
}

export default getBaddyProbability
