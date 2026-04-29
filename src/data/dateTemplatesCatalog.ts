type TemplateLike = {
  template: string;
  slots: string[];
};

const FOOD_PLACE_SLOT = "restaurant|fast_food|cafe|food_court|ice_cream";
const DESSERT_PLACE_SLOT = "ice_cream";
const OUTDOOR_PLACE_SLOT = "viewpoint|picnic_site|camp_site";
const LEISURE_PLACE_SLOT = "leisure|park|garden|nature_reserve|recreation_ground|dog_park|viewpoint|picnic_site|camp_site|pitch|amusement_arcade|playground|bowling_alley|miniature_golf";
const SHOP_PLACE_SLOT = "shop|mall|clothes|gift|toys|books|electronics";

export const SHORT_DATE_TEMPLATES: TemplateLike[] = [
  { template: `Grab a bite at {${FOOD_PLACE_SLOT}}`, slots: [FOOD_PLACE_SLOT] },
  { template: `Take a walk at {${LEISURE_PLACE_SLOT}}`, slots: [LEISURE_PLACE_SLOT] },
  { template: "{activity}", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  { template: `Get dessert at {${DESSERT_PLACE_SLOT}}`, slots: [DESSERT_PLACE_SLOT] },
  { template: `Visit {${OUTDOOR_PLACE_SLOT}}`, slots: [OUTDOOR_PLACE_SLOT] },
  { template: `Browse around {${SHOP_PLACE_SLOT}}`, slots: [SHOP_PLACE_SLOT] },
  { template: `Spend time at {${LEISURE_PLACE_SLOT}}`, slots: [LEISURE_PLACE_SLOT] },
  {
    template: "{activity} and then make {recipe}",
    slots: ["activity", "recipe"],
  },
  {
    template: `Stop at {${FOOD_PLACE_SLOT}} and then stroll at {${LEISURE_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT],
  },
  {
    template: `Explore {${SHOP_PLACE_SLOT}}, then get dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [SHOP_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `{activity} and then treat yourselves at {${DESSERT_PLACE_SLOT}}`,
    slots: ["activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Visit {${OUTDOOR_PLACE_SLOT}}, then walk through {${LEISURE_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, LEISURE_PLACE_SLOT],
  },
  {
    template: `Try {${LEISURE_PLACE_SLOT}}, then grab a quick bite at {${FOOD_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  {
    template: "Make {recipe} and {activity} to finish it off",
    slots: ["recipe", "activity"],
  },
];

export const STANDARD_DATE_TEMPLATES: TemplateLike[] = [
  { template: `Start at {${FOOD_PLACE_SLOT}}, then walk at {${LEISURE_PLACE_SLOT}}`, slots: [FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT] },
  {
    template: `{activity}, then grab dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: ["activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Make {recipe} together, then go to {${DESSERT_PLACE_SLOT}}`,
    slots: ["recipe", DESSERT_PLACE_SLOT],
  },
  {
    template: `Visit {${OUTDOOR_PLACE_SLOT}}, then stop at {${FOOD_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  {
    template: `Browse {${SHOP_PLACE_SLOT}} and then {activity}`,
    slots: [SHOP_PLACE_SLOT, "activity"],
  },
  {
    template: "{activity} and then {activity}",
    slots: ["activity", "activity"],
  },
  {
    template: `Lunch at {${FOOD_PLACE_SLOT}}, then explore {${OUTDOOR_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, OUTDOOR_PLACE_SLOT],
  },
  {
    template: `Walk through {${LEISURE_PLACE_SLOT}}, then shop at {${SHOP_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, SHOP_PLACE_SLOT],
  },
  {
    template: `Start with {${LEISURE_PLACE_SLOT}}, then dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Visit {${SHOP_PLACE_SLOT}}, eat at {${FOOD_PLACE_SLOT}}, then {activity}`,
    slots: [SHOP_PLACE_SLOT, FOOD_PLACE_SLOT, "activity"],
  },
  {
    template: `Go to {${OUTDOOR_PLACE_SLOT}}, {activity}, then {${DESSERT_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Try {${LEISURE_PLACE_SLOT}}, walk at {${LEISURE_PLACE_SLOT}}, and end at {${FOOD_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  { template: `Make {recipe}, then head to {${LEISURE_PLACE_SLOT}}`, slots: ["recipe", LEISURE_PLACE_SLOT] },
  {
    template: `{activity}, then visit {${OUTDOOR_PLACE_SLOT}}`,
    slots: ["activity", OUTDOOR_PLACE_SLOT],
  },
  {
    template: `Visit {${LEISURE_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, LEISURE_PLACE_SLOT],
  },
  {
    template: `Meal at {${FOOD_PLACE_SLOT}}, activity at {${LEISURE_PLACE_SLOT}}, and dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Explore {${OUTDOOR_PLACE_SLOT}}, browse {${SHOP_PLACE_SLOT}}, then grab {${FOOD_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, SHOP_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  {
    template: `{activity}, eat at {${FOOD_PLACE_SLOT}}, and finally {activity}`,
    slots: ["activity", FOOD_PLACE_SLOT, "activity"],
  },
  {
    template: `Walk around {${LEISURE_PLACE_SLOT}}, make {recipe}, and finish with {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, "recipe", DESSERT_PLACE_SLOT],
  },
  {
    template: `Go to {${LEISURE_PLACE_SLOT}}, then {activity}, then dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Explore {${SHOP_PLACE_SLOT}}, then {activity}, then relax at {${LEISURE_PLACE_SLOT}}`,
    slots: [SHOP_PLACE_SLOT, "activity", LEISURE_PLACE_SLOT],
  },
  {
    template: `Start at {${FOOD_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, and {activity} to end`,
    slots: [FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT, "activity"],
  },
  {
    template: `Visit {${OUTDOOR_PLACE_SLOT}}, then make {recipe}`,
    slots: [OUTDOOR_PLACE_SLOT, "recipe"],
  },
  {
    template: `{activity}, then {${LEISURE_PLACE_SLOT}}, then {${DESSERT_PLACE_SLOT}}`,
    slots: ["activity", LEISURE_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Begin at {${LEISURE_PLACE_SLOT}}, grab {${FOOD_PLACE_SLOT}}, and browse {${SHOP_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT, SHOP_PLACE_SLOT],
  },
];

export const LONG_DATE_TEMPLATES: TemplateLike[] = [
  {
    template: `Start at {${LEISURE_PLACE_SLOT}}, eat at {${FOOD_PLACE_SLOT}}, {activity}, and finish with {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Visit {${OUTDOOR_PLACE_SLOT}}, explore {${SHOP_PLACE_SLOT}}, then have {${FOOD_PLACE_SLOT}} for dinner`,
    slots: [OUTDOOR_PLACE_SLOT, SHOP_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  {
    template: `Make {recipe}, then go to {${LEISURE_PLACE_SLOT}}, and finish with {${DESSERT_PLACE_SLOT}}`,
    slots: ["recipe", LEISURE_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: "First, {activity}. Then, {activity}. Finally, {activity}.",
    slots: ["activity", "activity", "activity"],
  },
  {
    template: `Start with {${FOOD_PLACE_SLOT}}, visit {${OUTDOOR_PLACE_SLOT}}, then {activity}, and dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, OUTDOOR_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Walk at {${LEISURE_PLACE_SLOT}}, browse {${SHOP_PLACE_SLOT}}, enjoy {${LEISURE_PLACE_SLOT}}, then eat at {${FOOD_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, SHOP_PLACE_SLOT, LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  {
    template: `Make {recipe}, go to {${LEISURE_PLACE_SLOT}}, then relax at {${LEISURE_PLACE_SLOT}}`,
    slots: ["recipe", LEISURE_PLACE_SLOT, LEISURE_PLACE_SLOT],
  },
  {
    template: `Explore {${OUTDOOR_PLACE_SLOT}}, then {activity}, then {activity}, and end with {${DESSERT_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, "activity", "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Meal at {${FOOD_PLACE_SLOT}}, walk at {${LEISURE_PLACE_SLOT}}, shop at {${SHOP_PLACE_SLOT}}, and dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT, SHOP_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Go to {${LEISURE_PLACE_SLOT}}, then {activity}, then eat at {${FOOD_PLACE_SLOT}}. Finally, {activity}`,
    slots: [LEISURE_PLACE_SLOT, "activity", FOOD_PLACE_SLOT, "activity"],
  },
  {
    template: `Start at {${OUTDOOR_PLACE_SLOT}}, continue to {${LEISURE_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, then {${DESSERT_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, LEISURE_PLACE_SLOT, LEISURE_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Make {recipe}, then browse {${SHOP_PLACE_SLOT}}, {activity}, and end at {${FOOD_PLACE_SLOT}}`,
    slots: ["recipe", SHOP_PLACE_SLOT, "activity", FOOD_PLACE_SLOT],
  },
  {
    template: `Visit {${LEISURE_PLACE_SLOT}}, have {${FOOD_PLACE_SLOT}}, {activity}, visit {${OUTDOOR_PLACE_SLOT}}, and get {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT, "activity", OUTDOOR_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Explore {${SHOP_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, then make {recipe}, then go for {${DESSERT_PLACE_SLOT}}`,
    slots: [SHOP_PLACE_SLOT, LEISURE_PLACE_SLOT, "recipe", DESSERT_PLACE_SLOT],
  },
  {
    template: `{activity}, then {activity}, then have dinner at {${FOOD_PLACE_SLOT}}, then a walk at {${LEISURE_PLACE_SLOT}}`,
    slots: ["activity", "activity", FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT],
  },
  {
    template: `Go to {${OUTDOOR_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, then {activity}, and cap it off at {${FOOD_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, LEISURE_PLACE_SLOT, "activity", FOOD_PLACE_SLOT],
  },
  {
    template: `Begin at {${FOOD_PLACE_SLOT}}, go to {${SHOP_PLACE_SLOT}}, {activity}, then dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, SHOP_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `Visit {${LEISURE_PLACE_SLOT}}, then {${OUTDOOR_PLACE_SLOT}}, then {activity}, then {${LEISURE_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, OUTDOOR_PLACE_SLOT, "activity", LEISURE_PLACE_SLOT],
  },
  {
    template: `Make {recipe}, {activity}, walk at {${LEISURE_PLACE_SLOT}}, and finish at {${FOOD_PLACE_SLOT}}`,
    slots: ["recipe", "activity", LEISURE_PLACE_SLOT, FOOD_PLACE_SLOT],
  },
  {
    template: `Try {${LEISURE_PLACE_SLOT}}, then {activity}, then {${SHOP_PLACE_SLOT}}, then {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, "activity", SHOP_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Start at {${FOOD_PLACE_SLOT}}, then {${OUTDOOR_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, then {activity}, and dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [FOOD_PLACE_SLOT, OUTDOOR_PLACE_SLOT, LEISURE_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
  {
    template: `{activity}, then {${LEISURE_PLACE_SLOT}}, then {activity}, then eat at {${FOOD_PLACE_SLOT}}`,
    slots: ["activity", LEISURE_PLACE_SLOT, "activity", FOOD_PLACE_SLOT],
  },
  {
    template: `Walk at {${LEISURE_PLACE_SLOT}}, make {recipe}, then visit {${OUTDOOR_PLACE_SLOT}}, then dessert at {${DESSERT_PLACE_SLOT}}`,
    slots: [LEISURE_PLACE_SLOT, "recipe", OUTDOOR_PLACE_SLOT, DESSERT_PLACE_SLOT],
  },
  {
    template: `Explore {${SHOP_PLACE_SLOT}}, then have {${FOOD_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, and {activity}`,
    slots: [SHOP_PLACE_SLOT, FOOD_PLACE_SLOT, LEISURE_PLACE_SLOT, "activity"],
  },
  {
    template: `Visit {${OUTDOOR_PLACE_SLOT}}, then {${SHOP_PLACE_SLOT}}, then {${LEISURE_PLACE_SLOT}}, then {activity}, then {${DESSERT_PLACE_SLOT}}`,
    slots: [OUTDOOR_PLACE_SLOT, SHOP_PLACE_SLOT, LEISURE_PLACE_SLOT, "activity", DESSERT_PLACE_SLOT],
  },
];
