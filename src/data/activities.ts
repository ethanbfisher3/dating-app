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

const ALL_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
    categories: ["Entertainment"],
    description:
      "Dust off your favorite board games or try a new two-player game. A great way to spark some friendly competition and conversation from the comfort of your living room.",
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
    id: "act_007",
    name: "Go on a walk",
    categories: ["Entertainment"],
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
    categories: ["Food", "Entertainment"],
    description:
      "Push the coffee table aside, lay out a blanket, and eat dinner on the floor. It completely changes the dynamic of a standard dinner at home.",
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
    id: "act_003",
    name: "Do some stargazing",
    categories: ["Outdoors", "Entertainment"],
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
    name: "Cook something together with the ingredients you have on hand",
    categories: ["Food", "Education", "Entertainment"],
    description:
      "Pick a recipe you've both always wanted to try. Try to make it using only food items that you already have in your kitchen.",
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
    id: "act_005",
    name: "Have a DIY Paint and Sip",
    categories: ["Education", "Entertainment"],
    description:
      "Buy two cheap canvases and some paints. Follow along with a Bob Ross video or try to paint portraits of each other while enjoying your favorite beverage.",
    cost: 5,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_006",
    name: "Try a print-and-play escape room",
    categories: ["Entertainment", "Education"],
    description: "Download and print an at-home escape room kit. Work together to solve puzzles and crack codes at your kitchen table.",
    cost: 10,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_008",
    name: "Make a blanket fort and watch a movie together",
    categories: ["Entertainment"],
    description:
      "Channel your inner child by building a massive blanket fort in the living room, complete with pillows and string lights, then binge a movie series.",
    cost: 0,
    durationMinutes: {
      min: 90,
      max: 150,
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
    categories: ["Entertainment", "Sports"],
    description:
      "Start a two-player cooperative video game. It takes communication and teamwork, and provides an ongoing activity you can return to on future dates.",
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
    id: "act_010",
    name: "Learn to dance",
    categories: ["Entertainment", "Sports", "Education"],
    description: "Watch a YouTube video about dance, and learn something new together.",
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
    id: "act_011",
    name: "Make some origami",
    categories: ["Entertainment", "Education"],
    description: "Find some origami instructions online and try to make the creations together using just paper.",
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
    id: "act_012",
    name: "Make a DIY mini golf course",
    categories: ["Entertainment"],
    description: "Use objects from around the house to create a mini golf course.",
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
    id: "act_013",
    name: "Work on a puzzle together",
    categories: ["Entertainment", "Education"],
    description: "Get out a 1000-piece puzzle and work on it together while chatting and/or listening to music.",
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
    id: "act_014",
    name: "Have a Powerpoint party",
    categories: ["Entertainment", "Education"],
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
    name: "Have a GeoGuessr competition",
    categories: ["Entertainment", "Education"],
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
    name: "Play the Wikipedia race game",
    categories: ["Entertainment", "Education"],
    description:
      "Pick two completely random Wikipedia articles and race to get from one to the other by only clicking links within the articles.",
    cost: 0,
    durationMinutes: {
      min: 15,
      max: 30,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_017",
    name: "Write a story together",
    categories: ["Entertainment", "Education"],
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
    categories: ["Entertainment", "Education"],
    description:
      "Create structures to protect a raw egg from breaking when dropped. Use materials you have around the house, like straws, tape, and paper. Go somewhere high up to drop the eggs",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_019",
    name: "Try the Non-dominant hand challenge",
    categories: ["Entertainment", "Education"],
    description: "Try to do some task with your non-dominant hand and see who can do it better.",
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
    categories: ["Entertainment", "Education"],
    description:
      "Download a free stop-motion app on your phone, and make a short stop-motion movie together using objects around the house.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_021",
    name: "Have a karaoke night",
    categories: ["Entertainment"],
    description:
      "Pull up a free karaoke app or YouTube karaoke videos and take turns performing your favorite songs. Cheer each other on and don't take it too seriously.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_022",
    name: "Play card games together",
    categories: ["Entertainment"],
    description:
      "Break out a deck of cards and play classic two-player games like Rummy, War, Cribbage, or Speed. Easy to learn and surprisingly competitive.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_023",
    name: "Answer the '36 questions to fall in love'",
    categories: ["Entertainment", "Education"],
    description:
      "Look up Dr. Arthur Aron's famous 36 questions and take turns asking and answering them. The questions get progressively deeper and are a great way to connect.",
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
    id: "act_024",
    name: "Do an at-home spa night",
    categories: ["Entertainment"],
    description:
      "Grab some face masks, exfoliants, and nail polish. Dim the lights, put on relaxing music, and pamper each other with a low-key self-care night.",
    cost: 5,
    durationMinutes: {
      min: 45,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "6",
        endHour12: "11",
        startPeriod: "PM",
        endPeriod: "PM",
      },
    ],
  },
  {
    id: "act_025",
    name: "Go on a bike ride",
    categories: ["Outdoors", "Sports"],
    description:
      "Grab your bikes and explore a nearby trail, park path, or neighborhood. A great way to enjoy the outdoors together without any pressure.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ["March", "April", "May", "June", "July", "August", "September", "October"],
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "9",
        endHour12: "7",
        startPeriod: "AM",
        endPeriod: "PM",
      },
    ],
  },
  {
    id: "act_026",
    name: "Do a workout video together",
    categories: ["Sports", "Entertainment"],
    description:
      "Find a fun workout video on YouTube — dance cardio, yoga, kickboxing, or Pilates. Working out together is motivating and a little hilarious.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_027",
    name: "Watch a documentary together",
    categories: ["Entertainment", "Education"],
    description:
      "Pick a documentary on a topic you're both curious about — nature, history, true crime, food, or space. Great conversation starter afterward.",
    cost: 0,
    durationMinutes: {
      min: 60,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "6",
        endHour12: "11",
        startPeriod: "PM",
        endPeriod: "PM",
      },
    ],
  },
  {
    id: "act_028",
    name: "Take a virtual museum tour",
    categories: ["Education", "Entertainment"],
    description:
      "Many world-class museums offer free virtual tours online, including the Louvre, the Smithsonian, and the British Museum. Explore art and history from your couch.",
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
    id: "act_029",
    name: "Make friendship bracelets",
    categories: ["Entertainment", "Education"],
    description:
      "Grab some embroidery floss and learn a simple bracelet pattern together. Make matching ones for each other — it's easier than it sounds and a fun keepsake.",
    cost: 3,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_030",
    name: "Play truth or dare",
    categories: ["Entertainment"],
    description:
      "Classic for a reason. Keep it light and fun, or use it as a way to learn things about each other you wouldn't normally talk about.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_031",
    name: "Build a LEGO set together",
    categories: ["Entertainment", "Education"],
    description:
      "Grab a LEGO set and build it together. Even a basic set turns into a fun, focused activity where you talk and collaborate without screens.",
    cost: 10,
    durationMinutes: {
      min: 30,
      max: 120,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_032",
    name: "Go on an outdoor scavenger hunt",
    categories: ["Outdoors", "Entertainment"],
    description:
      "Look up a free scavenger hunt list online or make your own, then head outside and compete to find everything. Works in a park, neighborhood, or campus.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ["March", "April", "May", "June", "July", "August", "September", "October"],
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "10",
        endHour12: "7",
        startPeriod: "AM",
        endPeriod: "PM",
      },
    ],
  },
  {
    id: "act_033",
    name: "Watch the sunset or sunrise together",
    categories: ["Outdoors", "Entertainment"],
    description:
      "Find a good spot — a hilltop, rooftop, park bench, or open field — and watch the sky change colors together. Simple and genuinely memorable.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 45,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "5",
        endHour12: "9",
        startPeriod: "AM",
        endPeriod: "AM",
      },
      {
        startHour12: "6",
        endHour12: "9",
        startPeriod: "PM",
        endPeriod: "PM",
      },
    ],
  },
  {
    id: "act_034",
    name: "Do finger painting",
    categories: ["Entertainment", "Education"],
    description:
      "Grab some finger paints and large paper and paint whatever you feel like. No skill required — it's just fun to be messy and creative together.",
    cost: 5,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_035",
    name: "Play 20 questions",
    categories: ["Entertainment"],
    description:
      "One person thinks of something, the other asks up to 20 yes/no questions to figure out what it is. Great for car rides, restaurants, or waiting around.",
    cost: 0,
    durationMinutes: {
      min: 15,
      max: 30,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_036",
    name: "Write a bucket list together",
    categories: ["Entertainment", "Education"],
    description:
      "Each write your own bucket lists, then share them with each other. Find the overlapping items and plan which ones you want to tackle together.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 45,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_037",
    name: "Make a photo album or scrapbook together",
    categories: ["Entertainment", "Education"],
    description:
      "Print some recent photos and put together a small album or scrapbook. A surprisingly satisfying project and a great keepsake.",
    cost: 5,
    durationMinutes: {
      min: 30,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_038",
    name: "Have a fashion show",
    categories: ["Entertainment"],
    description:
      "Raid each other's closets, style each other in ridiculous or surprisingly good outfits, and do a runway walk. Surprisingly funny every time.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 45,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_039",
    name: "Make your own trail mix",
    categories: ["Food", "Entertainment"],
    description:
      "Lay out a bunch of trail mix ingredients — nuts, dried fruit, chocolate chips, pretzels, granola — and each design your perfect mix. Then trade and taste.",
    cost: 5,
    durationMinutes: {
      min: 15,
      max: 30,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_040",
    name: "Do a tie-dye project",
    categories: ["Entertainment"],
    description:
      "Grab a tie-dye kit from a craft store and dye a white shirt or pair of socks together. There's a satisfying reveal when you unfold them after letting the dye set.",
    cost: 10,
    durationMinutes: {
      min: 45,
      max: 90,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_041",
    name: "Play frisbee or catch",
    categories: ["Outdoors", "Sports"],
    description:
      "Head to a nearby park or open field and toss a frisbee or ball around. Low effort, high quality time together.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 60,
    },
    bestMonthsOfYear: ["March", "April", "May", "June", "July", "August", "September", "October"],
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: [
      {
        startHour12: "9",
        endHour12: "7",
        startPeriod: "AM",
        endPeriod: "PM",
      },
    ],
  },
  {
    id: "act_042",
    name: "Learn a magic trick together",
    categories: ["Entertainment", "Education"],
    description:
      "Look up a beginner card or coin trick on YouTube and practice until you can both perform it. Then try to fool each other.",
    cost: 0,
    durationMinutes: {
      min: 20,
      max: 45,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
  {
    id: "act_043",
    name: "Make a playlist for each other",
    categories: ["Entertainment", "Education"],
    description:
      "Each of you spend 15 minutes secretly making a playlist that describes how you feel about the other person or what you think they'd love. Then swap and listen together.",
    cost: 0,
    durationMinutes: {
      min: 30,
      max: 60,
    },
    bestMonthsOfYear: ALL_MONTHS,
    bestDaysOfWeek: ALL_WEEKDAYS,
    bestTimesOfDay: ALL_TIMES_OF_DAY,
  },
];

export function getActivityById(id: string) {
  return activities.find((activity) => activity.id === id);
}

export default activities;
