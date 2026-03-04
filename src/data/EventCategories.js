export const categoryIds = {
  9: "Arts & Entertainment",
  10: "Athletics",
  1006: "Conferences",
  7: "Devotionals & Forums",
  4: "Education",
  47: "Health & Wellness",
  49: "Student Life",
  52: "Other",
}

export const categories = [
  "Arts & Entertainment",
  "Athletics",
  "Conferences",
  "Devotionals & Forums",
  "Education",
  "Health & Wellness",
  "Student Life",
  "Other",
]

export const getCategoryFromId = (id) => {
  return categoryIds[id] || undefined
}

export const getCategoryIndexFromCategory = (category) => {
  const index = categories.indexOf(category)
  return index
}

export default getCategoryFromId
