const recipes = [
  {
    name: "Spaghetti",
    ingredients: {
      "Spaghetti Noodles": "1 cup",
      "Tomato Sauce or Spaghetti Sauce": "1 jar",
      Onions: 1,
      Garlic: "1 clove",
    },
    steps: [
      "Cook the pasta",
      "Sautee onions and garlic in another pan",
      "Add spaghetti sauce",
      "Put everything together",
    ],
    estimatedPrice: 10,
    estimatedTime: 30,
    categories: ["Lunch", "Dinner"],
    description: "Spaghetti is a fast, cheap, and simple meal!",
    imgSrc: `${process.env.PUBLIC_URL}/images/recipes/spaghetti.png`,
  },
  {
    name: "Eggs, Beans, and Salsa",
    imgSrc: `${process.env.PUBLIC_URL}/images/recipes/eggs_beans_salsa.png`,
    estimatedTime: 10,
    categories: ["Breakfast", "Lunch", "Dinner"],
    estimatedPrice: 5,
    ingredients: { Eggs: 3, Beans: "1 can", Salsa: "1/4 cup" },
    steps: ["Cook the eggs", "Cook the beans", "Serve with salsa"],
    description:
      "A protein-packed breakfast that's quick to make and keeps you full all morning.",
  },
]

export default recipes
