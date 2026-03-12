import { ALL } from "dns";
import type { DateCategory } from "../utils/utils";

export interface Activity {
  id: string;
  name: string;
  categories: DateCategory[];
  description: string;
  cost: number;
  durationMinutes: {
    min: number;
    max: number;
  };
  bestMonthsOfYear: string[];
  bestDaysOfWeek: string[];
  bestTimesOfDay: {
    startHour12: string;
    endHour12: string;
    startPeriod: string;
    endPeriod: string;
  }[];
}

const ALL_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ALL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ALL_TIMES_OF_DAY = [
  {
    startHour12: "12",
    endHour12: "11",
    startPeriod: "AM",
    endPeriod: "PM",
  },
];

export const activities: Activity[] = [
  {
    id: "act_001",
    name: "Play board games together",
    categories: ["Recreation"],
    description:
      "Dust off your favorite board games or try a new two-player game. A great way to spark some friendly competition and conversation from the comfort of your living room.",
    cost: 0,
    durationMinutes: {
      min: 60,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_007",
    name: "Go on a walk",
    categories: ["Recreation"],
    description: "Go on a short walk together.",
    cost: 0,
    durationMinutes: {
      min: 15,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_002",
    name: "Have a living room picnic",
    categories: ["Food", "Recreation"],
    description:
      "Push the coffee table aside, lay out a blanket, and eat dinner on the floor. It completely changes the dynamic of a standard dinner at home.",
    cost: 0,
    durationMinutes: {
      min: 60,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_003",
    name: "Do some stargazing",
    categories: ["Outdoors", "Nature", "Recreation"],
    description:
      "Step out into the backyard or a nearby open space, lay out a blanket, and look at the stars. Use a free constellation app to see what you can spot.",
    cost: 0,
    durationMinutes: {
      min: 15,
      max: 45,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "7",
        endHour12: "1",
        startPeriod: "PM",
        endPeriod: "AM",
      },
    ],
  },
  {
    id: "act_004",
    name: "Cook a complex recipe together",
    categories: ["Food", "Learning", "Recreation"],
    description:
      "Pick a recipe you've both always wanted to try but never had the time for—like handmade pasta or beef wellington. Split the prep work and enjoy the results.",
    cost: 0,
    durationMinutes: {
      min: 90,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_005",
    name: "Have a DIY Paint and Sip",
    categories: ["Learning", "Recreation"],
    description:
      "Buy two cheap canvases and some paints. Follow along with a Bob Ross video or try to paint portraits of each other while enjoying your favorite beverage.",
    cost: 5,
    durationMinutes: {
      min: 60,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_006",
    name: "Try a print-and-play escape room",
    categories: ["Recreation", "Learning"],
    description:
      "Download and print an at-home escape room kit. Work together to solve puzzles and crack codes at your kitchen table.",
    cost: 10,
    durationMinutes: {
      min: 60,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_008",
    name: "Make a blanket fort and watch a movie together",
    categories: ["Recreation"],
    description:
      "Channel your inner child by building a massive blanket fort in the living room, complete with pillows and string lights, then binge a movie series.",
    cost: 0,
    durationMinutes: {
      min: 120,
      max: 240,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "7",
        endHour12: "1",
        startPeriod: "PM",
        endPeriod: "AM",
      },
    ],
  },
  {
    id: "act_009",
    name: "Play a co-op video game",
    categories: ["Recreation", "Sports"],
    description:
      "Start a two-player cooperative video game. It takes communication and teamwork, and provides an ongoing activity you can return to on future dates.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_010",
    name: "Learn to dance",
    categories: ["Recreation", "Sports", "Learning"],
    description:
      "Watch a YouTube video about dance, and learn something new together.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_011",
    name: "Make some origami",
    categories: ["Recreation", "Learning"],
    description:
      "Watch a YouTube video about dance, and learn something new together.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_012",
    name: "Make a DIY mini golf course",
    categories: ["Recreation"],
    description:
      "Use objects from around the house to create a mini golf course.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_013",
    name: "Work on a puzzle together",
    categories: ["Recreation", "Learning"],
    description:
      "Get out a 1000-piece puzzle and work on it together while chatting and/or listening to music.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 180,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_014",
    name: "Have a Powerpoint party",
    categories: ["Recreation", "Learning"],
    description:
      "Take 30 minutes to create a short Powerpoint presentation about a topic you're interested in, then share them with each other.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_015",
    name: "GeoGuessr competition",
    categories: ["Recreation", "Learning"],
    description: "Face off in a game of GeoGuessr together",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_016",
    name: "Wikipedia race",
    categories: ["Recreation", "Learning"],
    description:
      "Pick two completely random Wikipedia articles and race to get from one to the other by only clicking links within the articles.",
    cost: 0,
    durationMinutes: {
      min: 15,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_017",
    name: "Write a story together",
    categories: ["Recreation", "Learning"],
    description:
      "Take turns writing sentences of a story, building off of what the other person wrote. See where your combined creativity takes you!",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_018",
    name: "Play the Egg Drop Game",
    categories: ["Recreation", "Learning"],
    description:
      "Create structures to protect a raw egg from breaking when dropped. Use materials you have around the house, like straws, tape, and paper. Go somewhere high up to drop the eggs",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_019",
    name: "Non-dominant hand challenge",
    categories: ["Recreation", "Learning"],
    description:
      "Try to do some task with your non-dominant hand and see who can do it better.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_020",
    name: "Make a Stop-Motion movie",
    categories: ["Recreation", "Learning"],
    description:
      "Download a free stop-motion app on your phone, and make a short stop-motion movie together using objects around the house.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
];

export default activities;
