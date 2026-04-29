type TemplateLike = {
  template: string;
  slots: string[];
};

export const SHORT_DATE_TEMPLATES: TemplateLike[] = [
  { template: "Grab a bite at {restaurant}", slots: ["restaurant"] },
  { template: "Take a walk at {leisure}", slots: ["leisure"] },
  { template: "{activity}", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  { template: "Get dessert at {ice_cream}", slots: ["ice_cream"] },
  { template: "Visit {tourism}", slots: ["tourism"] },
  { template: "Browse around {shop}", slots: ["shop"] },
  { template: "Spend time at {leisure}", slots: ["leisure"] },
  {
    template: "{activity} and then make {recipe}",
    slots: ["activity", "recipe"],
  },
  {
    template: "Stop at {restaurant} and then stroll at {leisure}",
    slots: ["restaurant", "leisure"],
  },
  {
    template: "Explore {shop}, then get dessert at {ice_cream}",
    slots: ["shop", "ice_cream"],
  },
  {
    template: "{activity} and then treat yourselves at {ice_cream}",
    slots: ["activity", "ice_cream"],
  },
  {
    template: "Visit {tourism}, then walk through {leisure}",
    slots: ["tourism", "leisure"],
  },
  {
    template: "Try {leisure}, then grab a quick bite at {restaurant}",
    slots: ["leisure", "restaurant"],
  },
  {
    template: "Make {recipe} and {activity} to finish it off",
    slots: ["recipe", "activity"],
  },
];

export const STANDARD_DATE_TEMPLATES: TemplateLike[] = [
  { template: "Start at {restaurant}, then walk at {leisure}", slots: ["restaurant", "leisure"] },
  {
    template: "{activity}, then grab dessert at {ice_cream}",
    slots: ["activity", "ice_cream"],
  },
  {
    template: "Make {recipe} together, then go to {ice_cream}",
    slots: ["recipe", "ice_cream"],
  },
  {
    template: "Visit {tourism}, then stop at {restaurant}",
    slots: ["tourism", "restaurant"],
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
    template: "Lunch at {restaurant}, then explore {tourism}",
    slots: ["restaurant", "tourism"],
  },
  {
    template: "Walk through {leisure}, then shop at {shop}",
    slots: ["leisure", "shop"],
  },
  {
    template: "Start with {leisure}, then dessert at {ice_cream}",
    slots: ["leisure", "ice_cream"],
  },
  {
    template: "Visit {shop}, eat at {restaurant}, then {activity}",
    slots: ["shop", "restaurant", "activity"],
  },
  {
    template: "Go to {tourism}, {activity}, then {ice_cream}",
    slots: ["tourism", "activity", "ice_cream"],
  },
  {
    template: "Try {leisure}, walk at {leisure}, and end at {restaurant}",
    slots: ["leisure", "leisure", "restaurant"],
  },
  { template: "Make {recipe}, then head to {leisure}", slots: ["recipe", "leisure"] },
  {
    template: "{activity}, then visit {tourism}",
    slots: ["activity", "tourism"],
  },
  {
    template: "Visit {leisure}, then {leisure}",
    slots: ["leisure", "leisure"],
  },
  {
    template: "Meal at {restaurant}, activity at {leisure}, and dessert at {ice_cream}",
    slots: ["restaurant", "leisure", "ice_cream"],
  },
  {
    template: "Explore {tourism}, browse {shop}, then grab {restaurant}",
    slots: ["tourism", "shop", "restaurant"],
  },
  {
    template: "{activity}, eat at {restaurant}, and finally {activity}",
    slots: ["activity", "restaurant", "activity"],
  },
  {
    template: "Walk around {leisure}, make {recipe}, and finish with {ice_cream}",
    slots: ["leisure", "recipe", "ice_cream"],
  },
  {
    template: "Go to {leisure}, then {activity}, then dessert at {ice_cream}",
    slots: ["leisure", "activity", "ice_cream"],
  },
  {
    template: "Explore {shop}, then {activity}, then relax at {leisure}",
    slots: ["shop", "activity", "leisure"],
  },
  {
    template: "Start at {restaurant}, then {leisure}, and {activity} to end",
    slots: ["restaurant", "leisure", "activity"],
  },
  {
    template: "Visit {tourism}, then make {recipe}",
    slots: ["tourism", "recipe"],
  },
  {
    template: "{activity}, then {leisure}, then {ice_cream}",
    slots: ["activity", "leisure", "ice_cream"],
  },
  {
    template: "Begin at {leisure}, grab {restaurant}, and browse {shop}",
    slots: ["leisure", "restaurant", "shop"],
  },
];

export const LONG_DATE_TEMPLATES: TemplateLike[] = [
  {
    template: "Start at {leisure}, eat at {restaurant}, {activity}, and finish with {ice_cream}",
    slots: ["leisure", "restaurant", "activity", "ice_cream"],
  },
  {
    template: "Visit {tourism}, explore {shop}, then have {restaurant} for dinner",
    slots: ["tourism", "shop", "restaurant"],
  },
  {
    template: "Make {recipe}, then go to {leisure}, and finish with {ice_cream}",
    slots: ["recipe", "leisure", "ice_cream"],
  },
  {
    template: "First, {activity}. Then, {activity}. Finally, {activity}.",
    slots: ["activity", "activity", "activity"],
  },
  {
    template: "Start with {restaurant}, visit {tourism}, then {activity}, and dessert at {ice_cream}",
    slots: ["restaurant", "tourism", "activity", "ice_cream"],
  },
  {
    template: "Walk at {leisure}, browse {shop}, enjoy {leisure}, then eat at {restaurant}",
    slots: ["leisure", "shop", "leisure", "restaurant"],
  },
  {
    template: "Make {recipe}, go to {leisure}, then relax at {leisure}",
    slots: ["recipe", "leisure", "leisure"],
  },
  {
    template: "Explore {tourism}, then {activity}, then {activity}, and end with {ice_cream}",
    slots: ["tourism", "activity", "activity", "ice_cream"],
  },
  {
    template: "Meal at {restaurant}, walk at {leisure}, shop at {shop}, and dessert at {ice_cream}",
    slots: ["restaurant", "leisure", "shop", "ice_cream"],
  },
  {
    template: "Go to {leisure}, then {activity}, then eat at {restaurant}. Finally, {activity}",
    slots: ["leisure", "activity", "restaurant", "activity"],
  },
  {
    template: "Start at {tourism}, continue to {leisure}, then {leisure}, then {ice_cream}",
    slots: ["tourism", "leisure", "leisure", "ice_cream"],
  },
  {
    template: "Make {recipe}, then browse {shop}, {activity}, and end at {restaurant}",
    slots: ["recipe", "shop", "activity", "restaurant"],
  },
  {
    template: "Visit {leisure}, have {restaurant}, {activity}, visit {tourism}, and get {ice_cream}",
    slots: ["leisure", "restaurant", "activity", "tourism", "ice_cream"],
  },
  {
    template: "Explore {shop}, then {leisure}, then make {recipe}, then go for {ice_cream}",
    slots: ["shop", "leisure", "recipe", "ice_cream"],
  },
  {
    template: "{activity}, then {activity}, then have dinner at {restaurant}, then a walk at {leisure}",
    slots: ["activity", "activity", "restaurant", "leisure"],
  },
  {
    template: "Go to {tourism}, then {leisure}, then {activity}, and cap it off at {restaurant}",
    slots: ["tourism", "leisure", "activity", "restaurant"],
  },
  {
    template: "Begin at {restaurant}, go to {shop}, {activity}, then dessert at {ice_cream}",
    slots: ["restaurant", "shop", "activity", "ice_cream"],
  },
  {
    template: "Visit {leisure}, then {tourism}, then {activity}, then {leisure}",
    slots: ["leisure", "tourism", "activity", "leisure"],
  },
  {
    template: "Make {recipe}, {activity}, walk at {leisure}, and finish at {restaurant}",
    slots: ["recipe", "activity", "leisure", "restaurant"],
  },
  {
    template: "Try {leisure}, then {activity}, then {shop}, then {ice_cream}",
    slots: ["leisure", "activity", "shop", "ice_cream"],
  },
  {
    template: "Start at {restaurant}, then {tourism}, then {leisure}, then {activity}, and dessert at {ice_cream}",
    slots: ["restaurant", "tourism", "leisure", "activity", "ice_cream"],
  },
  {
    template: "{activity}, then {leisure}, then {activity}, then eat at {restaurant}",
    slots: ["activity", "leisure", "activity", "restaurant"],
  },
  {
    template: "Walk at {leisure}, make {recipe}, then visit {tourism}, then dessert at {ice_cream}",
    slots: ["leisure", "recipe", "tourism", "ice_cream"],
  },
  {
    template: "Explore {shop}, then have {restaurant}, then {leisure}, and {activity}",
    slots: ["shop", "restaurant", "leisure", "activity"],
  },
  {
    template: "Visit {tourism}, then {shop}, then {leisure}, then {activity}, then {ice_cream}",
    slots: ["tourism", "shop", "leisure", "activity", "ice_cream"],
  },
];
