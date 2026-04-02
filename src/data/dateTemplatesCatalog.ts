type TemplateLike = {
  template: string;
  slots: string[];
};

export const SHORT_DATE_TEMPLATES: TemplateLike[] = [
  { template: "Grab a bite at {meal}", slots: ["meal"] },
  { template: "Take a walk at {park}", slots: ["park"] },
  { template: "{activity}", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  { template: "Get dessert at {dessert}", slots: ["dessert"] },
  { template: "Visit {learningSpot}", slots: ["learningSpot"] },
  { template: "Browse around {shop}", slots: ["shop"] },
  { template: "Play around at {activityPlace}", slots: ["activityPlace"] },
  {
    template: "{activity} and then make {recipe}",
    slots: ["activity", "recipe"],
  },
  {
    template: "Stop at {meal} and a stroll at {park}",
    slots: ["meal", "park"],
  },
  {
    template: "Explore {shop}, then get dessert at {dessert}",
    slots: ["shop", "dessert"],
  },
  {
    template: "{activity} and then treat yourselves at {dessert}",
    slots: ["activity", "dessert"],
  },
  {
    template: "Visit {learningSpot}, then walk through {park}",
    slots: ["learningSpot", "park"],
  },
  {
    template: "Try {activityPlace}, then grab a quick bite at {meal}",
    slots: ["activityPlace", "meal"],
  },
  {
    template: "Make {recipe} and {activity} to finish it off",
    slots: ["recipe", "activity"],
  },
];

export const STANDARD_DATE_TEMPLATES: TemplateLike[] = [
  { template: "Start at {meal}, then walk at {park}", slots: ["meal", "park"] },
  {
    template: "{activity}, then grab dessert at {dessert}",
    slots: ["activity", "dessert"],
  },
  {
    template: "Make {recipe} together, then go to {dessert}",
    slots: ["recipe", "dessert"],
  },
  {
    template: "Visit {learningSpot}, then stop at {meal}",
    slots: ["learningSpot", "meal"],
  },
  {
    template: "Browse {shop} and then {activity}",
    slots: ["shop", "activity"],
  },
  {
    template: "{activity} and then {activity}",
    slots: ["activity", "activity"],
  },
  {
    template: "Lunch at {meal}, then explore {learningSpot}",
    slots: ["meal", "learningSpot"],
  },
  {
    template: "Walk through {park}, then shop at {shop}",
    slots: ["park", "shop"],
  },
  {
    template: "Start with {activityPlace}, then dessert at {dessert}",
    slots: ["activityPlace", "dessert"],
  },
  {
    template: "Visit {shop}, eat at {meal}, then {activity}",
    slots: ["shop", "meal", "activity"],
  },
  {
    template: "Go to {learningSpot}, {activity}, then {dessert}",
    slots: ["learningSpot", "activity", "dessert"],
  },
  {
    template: "Try {activityPlace}, walk at {park}, and end at {meal}",
    slots: ["activityPlace", "park", "meal"],
  },
  { template: "Make {recipe}, then head to {park}", slots: ["recipe", "park"] },
  {
    template: "{activity}, then visit {learningSpot}",
    slots: ["activity", "learningSpot"],
  },
  {
    template: "Visit {park}, then {activityPlace}",
    slots: ["park", "activityPlace"],
  },
  {
    template: "Meal at {meal}, activity at {activityPlace}, and dessert at {dessert}",
    slots: ["meal", "activityPlace", "dessert"],
  },
  {
    template: "Explore {learningSpot}, browse {shop}, then grab {meal}",
    slots: ["learningSpot", "shop", "meal"],
  },
  {
    template: "{activity}, eat at {meal}, and finally {activity}",
    slots: ["activity", "meal", "activity"],
  },
  {
    template: "Walk around {park}, make {recipe}, and finish with {dessert}",
    slots: ["park", "recipe", "dessert"],
  },
  {
    template: "Go to {activityPlace}, then {activity}, then dessert at {dessert}",
    slots: ["activityPlace", "activity", "dessert"],
  },
  {
    template: "Explore {shop}, then {activity}, then relax at {park}",
    slots: ["shop", "activity", "park"],
  },
  {
    template: "Start at {meal}, then {activityPlace}, and {activity} to end",
    slots: ["meal", "activityPlace", "activity"],
  },
  {
    template: "Visit {learningSpot}, then make {recipe}",
    slots: ["learningSpot", "recipe"],
  },
  {
    template: "{activity}, then {activityPlace}, then {dessert}",
    slots: ["activity", "activityPlace", "dessert"],
  },
  {
    template: "Begin at {park}, grab {meal}, and browse {shop}",
    slots: ["park", "meal", "shop"],
  },
];

export const LONG_DATE_TEMPLATES: TemplateLike[] = [
  {
    template: "Start at {park}, eat at {meal}, {activity}, and finish with {dessert}",
    slots: ["park", "meal", "activity", "dessert"],
  },
  {
    template: "Visit {learningSpot}, explore {shop}, then have {meal} for dinner",
    slots: ["learningSpot", "shop", "meal"],
  },
  {
    template: "Make {recipe}, then go to {park}, and finish with {dessert}",
    slots: ["recipe", "park", "dessert"],
  },
  {
    template: "First, {activity}. Then, {activity}. Finally, {activity}.",
    slots: ["activity", "activity", "activity"],
  },
  {
    template: "Start with {meal}, visit {learningSpot}, then {activity}, and dessert at {dessert}",
    slots: ["meal", "learningSpot", "activity", "dessert"],
  },
  {
    template: "Walk at {park}, browse {shop}, enjoy {activityPlace}, then eat at {meal}",
    slots: ["park", "shop", "activityPlace", "meal"],
  },
  {
    template: "Make {recipe}, go to {activityPlace}, then relax at {park}",
    slots: ["recipe", "activityPlace", "park"],
  },
  {
    template: "Explore {learningSpot}, then {activity}, then {activity}, and end with {dessert}",
    slots: ["learningSpot", "activity", "activity", "dessert"],
  },
  {
    template: "Meal at {meal}, walk at {park}, shop at {shop}, and dessert at {dessert}",
    slots: ["meal", "park", "shop", "dessert"],
  },
  {
    template: "Go to {activityPlace}, then {activity}, then eat at {meal}. Finally, {activity}",
    slots: ["activityPlace", "activity", "meal", "activity"],
  },
  {
    template: "Start at {learningSpot}, continue to {park}, then {activityPlace}, then {dessert}",
    slots: ["learningSpot", "park", "activityPlace", "dessert"],
  },
  {
    template: "Make {recipe}, then browse {shop}, {activity}, and end at {meal}",
    slots: ["recipe", "shop", "activity", "meal"],
  },
  {
    template: "Visit {park}, have {meal}, {activity}, visit {learningSpot}, and get {dessert}",
    slots: ["park", "meal", "activity", "learningSpot", "dessert"],
  },
  {
    template: "Explore {shop}, then {activityPlace}, then make {recipe}, then go for {dessert}",
    slots: ["shop", "activityPlace", "recipe", "dessert"],
  },
  {
    template: "{activity}, then {activity}, then have dinner at {meal}, then a walk at {park}",
    slots: ["activity", "activity", "meal", "park"],
  },
  {
    template: "Go to {learningSpot}, then {activityPlace}, then {activity}, and cap it off at {meal}",
    slots: ["learningSpot", "activityPlace", "activity", "meal"],
  },
  {
    template: "Begin at {meal}, go to {shop}, {activity}, then dessert at {dessert}",
    slots: ["meal", "shop", "activity", "dessert"],
  },
  {
    template: "Visit {park}, then {learningSpot}, then {activity}, then {activityPlace}",
    slots: ["park", "learningSpot", "activity", "activityPlace"],
  },
  {
    template: "Make {recipe}, {activity}, walk at {park}, and finish at {meal}",
    slots: ["recipe", "activity", "park", "meal"],
  },
  {
    template: "Try {activityPlace}, then {activity}, then {shop}, then {dessert}",
    slots: ["activityPlace", "activity", "shop", "dessert"],
  },
  {
    template: "Start at {meal}, then {learningSpot}, then {park}, then {activity}, and dessert at {dessert}",
    slots: ["meal", "learningSpot", "park", "activity", "dessert"],
  },
  {
    template: "{activity}, then {activityPlace}, then {activity}, then eat at {meal}",
    slots: ["activity", "activityPlace", "activity", "meal"],
  },
  {
    template: "Walk at {park}, make {recipe}, then visit {learningSpot}, then dessert at {dessert}",
    slots: ["park", "recipe", "learningSpot", "dessert"],
  },
  {
    template: "Explore {shop}, then have {meal}, then {activityPlace}, and {activity}",
    slots: ["shop", "meal", "activityPlace", "activity"],
  },
  {
    template: "Visit {learningSpot}, then {shop}, then {park}, then {activity}, then {dessert}",
    slots: ["learningSpot", "shop", "park", "activity", "dessert"],
  },
];
