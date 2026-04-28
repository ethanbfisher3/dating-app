type TemplateLike = {
  template: string;
  slots: string[];
};

export const SHORT_DATE_TEMPLATES: TemplateLike[] = [
  { template: "Grab a bite at {restaurant}", slots: ["restaurant"] },
  { template: "Take a walk at {park}", slots: ["park"] },
  { template: "{activity}", slots: ["activity"] },
  { template: "Make {recipe} together", slots: ["recipe"] },
  { template: "Get dessert at {ice_cream}", slots: ["ice_cream"] },
  { template: "Visit {museum}", slots: ["museum"] },
  { template: "Browse around {mall}", slots: ["mall"] },
  { template: "Play around at {amusement_arcade}", slots: ["amusement_arcade"] },
  {
    template: "{activity} and then make {recipe}",
    slots: ["activity", "recipe"],
  },
  {
    template: "Stop at {restaurant} and a stroll at {park}",
    slots: ["restaurant", "park"],
  },
  {
    template: "Explore {mall}, then get dessert at {ice_cream}",
    slots: ["mall", "ice_cream"],
  },
  {
    template: "{activity} and then treat yourselves at {ice_cream}",
    slots: ["activity", "ice_cream"],
  },
  {
    template: "Visit {museum}, then walk through {park}",
    slots: ["museum", "park"],
  },
  {
    template: "Try {amusement_arcade}, then grab a quick bite at {restaurant}",
    slots: ["amusement_arcade", "restaurant"],
  },
  {
    template: "Make {recipe} and {activity} to finish it off",
    slots: ["recipe", "activity"],
  },
];

export const STANDARD_DATE_TEMPLATES: TemplateLike[] = [
  { template: "Start at {restaurant}, then walk at {park}", slots: ["restaurant", "park"] },
  {
    template: "{activity}, then grab dessert at {ice_cream}",
    slots: ["activity", "ice_cream"],
  },
  {
    template: "Make {recipe} together, then go to {ice_cream}",
    slots: ["recipe", "ice_cream"],
  },
  {
    template: "Visit {museum}, then stop at {restaurant}",
    slots: ["museum", "restaurant"],
  },
  {
    template: "Browse {mall} and then {activity}",
    slots: ["mall", "activity"],
  },
  {
    template: "{activity} and then {activity}",
    slots: ["activity", "activity"],
  },
  {
    template: "Lunch at {restaurant}, then explore {museum}",
    slots: ["restaurant", "museum"],
  },
  {
    template: "Walk through {park}, then shop at {mall}",
    slots: ["park", "mall"],
  },
  {
    template: "Start with {amusement_arcade}, then dessert at {ice_cream}",
    slots: ["amusement_arcade", "ice_cream"],
  },
  {
    template: "Visit {mall}, eat at {restaurant}, then {activity}",
    slots: ["mall", "restaurant", "activity"],
  },
  {
    template: "Go to {museum}, {activity}, then {ice_cream}",
    slots: ["museum", "activity", "ice_cream"],
  },
  {
    template: "Try {amusement_arcade}, walk at {park}, and end at {restaurant}",
    slots: ["amusement_arcade", "park", "restaurant"],
  },
  { template: "Make {recipe}, then head to {park}", slots: ["recipe", "park"] },
  {
    template: "{activity}, then visit {museum}",
    slots: ["activity", "museum"],
  },
  {
    template: "Visit {park}, then {amusement_arcade}",
    slots: ["park", "amusement_arcade"],
  },
  {
    template: "Meal at {restaurant}, activity at {amusement_arcade}, and dessert at {ice_cream}",
    slots: ["restaurant", "amusement_arcade", "ice_cream"],
  },
  {
    template: "Explore {museum}, browse {mall}, then grab {restaurant}",
    slots: ["museum", "mall", "restaurant"],
  },
  {
    template: "{activity}, eat at {restaurant}, and finally {activity}",
    slots: ["activity", "restaurant", "activity"],
  },
  {
    template: "Walk around {park}, make {recipe}, and finish with {ice_cream}",
    slots: ["park", "recipe", "ice_cream"],
  },
  {
    template: "Go to {amusement_arcade}, then {activity}, then dessert at {ice_cream}",
    slots: ["amusement_arcade", "activity", "ice_cream"],
  },
  {
    template: "Explore {mall}, then {activity}, then relax at {park}",
    slots: ["mall", "activity", "park"],
  },
  {
    template: "Start at {restaurant}, then {amusement_arcade}, and {activity} to end",
    slots: ["restaurant", "amusement_arcade", "activity"],
  },
  {
    template: "Visit {museum}, then make {recipe}",
    slots: ["museum", "recipe"],
  },
  {
    template: "{activity}, then {amusement_arcade}, then {ice_cream}",
    slots: ["activity", "amusement_arcade", "ice_cream"],
  },
  {
    template: "Begin at {park}, grab {restaurant}, and browse {mall}",
    slots: ["park", "restaurant", "mall"],
  },
];

export const LONG_DATE_TEMPLATES: TemplateLike[] = [
  {
    template: "Start at {park}, eat at {restaurant}, {activity}, and finish with {ice_cream}",
    slots: ["park", "restaurant", "activity", "ice_cream"],
  },
  {
    template: "Visit {museum}, explore {mall}, then have {restaurant} for dinner",
    slots: ["museum", "mall", "restaurant"],
  },
  {
    template: "Make {recipe}, then go to {park}, and finish with {ice_cream}",
    slots: ["recipe", "park", "ice_cream"],
  },
  {
    template: "First, {activity}. Then, {activity}. Finally, {activity}.",
    slots: ["activity", "activity", "activity"],
  },
  {
    template: "Start with {restaurant}, visit {museum}, then {activity}, and dessert at {ice_cream}",
    slots: ["restaurant", "museum", "activity", "ice_cream"],
  },
  {
    template: "Walk at {park}, browse {mall}, enjoy {amusement_arcade}, then eat at {restaurant}",
    slots: ["park", "mall", "amusement_arcade", "restaurant"],
  },
  {
    template: "Make {recipe}, go to {amusement_arcade}, then relax at {park}",
    slots: ["recipe", "amusement_arcade", "park"],
  },
  {
    template: "Explore {museum}, then {activity}, then {activity}, and end with {ice_cream}",
    slots: ["museum", "activity", "activity", "ice_cream"],
  },
  {
    template: "Meal at {restaurant}, walk at {park}, shop at {mall}, and dessert at {ice_cream}",
    slots: ["restaurant", "park", "mall", "ice_cream"],
  },
  {
    template: "Go to {amusement_arcade}, then {activity}, then eat at {restaurant}. Finally, {activity}",
    slots: ["amusement_arcade", "activity", "restaurant", "activity"],
  },
  {
    template: "Start at {museum}, continue to {park}, then {amusement_arcade}, then {ice_cream}",
    slots: ["museum", "park", "amusement_arcade", "ice_cream"],
  },
  {
    template: "Make {recipe}, then browse {mall}, {activity}, and end at {restaurant}",
    slots: ["recipe", "mall", "activity", "restaurant"],
  },
  {
    template: "Visit {park}, have {restaurant}, {activity}, visit {museum}, and get {ice_cream}",
    slots: ["park", "restaurant", "activity", "museum", "ice_cream"],
  },
  {
    template: "Explore {mall}, then {amusement_arcade}, then make {recipe}, then go for {ice_cream}",
    slots: ["mall", "amusement_arcade", "recipe", "ice_cream"],
  },
  {
    template: "{activity}, then {activity}, then have dinner at {restaurant}, then a walk at {park}",
    slots: ["activity", "activity", "restaurant", "park"],
  },
  {
    template: "Go to {museum}, then {amusement_arcade}, then {activity}, and cap it off at {restaurant}",
    slots: ["museum", "amusement_arcade", "activity", "restaurant"],
  },
  {
    template: "Begin at {restaurant}, go to {mall}, {activity}, then dessert at {ice_cream}",
    slots: ["restaurant", "mall", "activity", "ice_cream"],
  },
  {
    template: "Visit {park}, then {museum}, then {activity}, then {amusement_arcade}",
    slots: ["park", "museum", "activity", "amusement_arcade"],
  },
  {
    template: "Make {recipe}, {activity}, walk at {park}, and finish at {restaurant}",
    slots: ["recipe", "activity", "park", "restaurant"],
  },
  {
    template: "Try {amusement_arcade}, then {activity}, then {mall}, then {ice_cream}",
    slots: ["amusement_arcade", "activity", "mall", "ice_cream"],
  },
  {
    template: "Start at {restaurant}, then {museum}, then {park}, then {activity}, and dessert at {ice_cream}",
    slots: ["restaurant", "museum", "park", "activity", "ice_cream"],
  },
  {
    template: "{activity}, then {amusement_arcade}, then {activity}, then eat at {restaurant}",
    slots: ["activity", "amusement_arcade", "activity", "restaurant"],
  },
  {
    template: "Walk at {park}, make {recipe}, then visit {museum}, then dessert at {ice_cream}",
    slots: ["park", "recipe", "museum", "ice_cream"],
  },
  {
    template: "Explore {mall}, then have {restaurant}, then {amusement_arcade}, and {activity}",
    slots: ["mall", "restaurant", "amusement_arcade", "activity"],
  },
  {
    template: "Visit {museum}, then {mall}, then {park}, then {activity}, then {ice_cream}",
    slots: ["museum", "mall", "park", "activity", "ice_cream"],
  },
];
