import config from "../config"
import burgers_and_sandwiches from "./ssc_deals/burgers_and_sandwiches"
import entertainment from "./ssc_deals/entertainment"
import free_deals from "./ssc_deals/free_deals"
import pizza from "./ssc_deals/pizza"
import restaurants from "./ssc_deals/restaurants"
import treats_and_drinks from "./ssc_deals/treats_and_drinks"
import { sanitizeUri } from "../utils/imageUtils"
import { findAssetForPath } from "../assets/imageMap"

export interface DateIdea {
  name: string
  mapSrc?: string
  description: string
  image?: any
  website?: string
  rating?: string
  pricing?: string
  free?: boolean
  hours?: string
  categories: string[]
  minDateNumber: number
  distanceFromCampus?: number
  timeOfDay: string[]
  seasonalTimeframe: {
    months: string[]
  }
  CanUseSSC: boolean
  locations?: {
    name: string
    src: string
    distanceFromCampus: number | string
  }[]
  link?: {
    text: string
    url: string
  }
  majorRizz?: boolean
}

const dateideas: DateIdea[] = [
  {
    name: "Provo Farmers Market",
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3045.9467147884125!2d-111.6712989236048!3d40.23248696683182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x874d99ffbc44fe4f%3A0xf80b7a7a8af35062!2sProvo%20Farmers%20Market!5e0!3m2!1sen!2sus!4v1726350046948!5m2!1sen!2sus",
    image: require("../../assets/images/date_ideas/farmers_market.png"),
    website: "http://www.provofarmersmarket.com/",
    rating: "★★★★★",
    pricing: "$0-$30/person",
    free: false,
    hours: "Saturday 9AM-2PM",
    categories: ["Outdoors", "Shopping"],
    description:
      "Great for buying fresh produce and spending time with a girl!",
    minDateNumber: 1,
    distanceFromCampus: 3,
    timeOfDay: ["morning", "afternoon"],
    seasonalTimeframe: {
      months: ["June", "July", "August", "September", "October"],
    },
    CanUseSSC: false,
  },
  {
    name: "Pickleball",
    image: require("../../assets/images/date_ideas/pickleball.png"),
    description:
      "Pickleball is a great way to spend time with a girl! It allows for exercise but it's easy enough to keep a conversation going too!",
    minDateNumber: 0,
    free: true,
    categories: ["Outdoors", "Recreation", "Sports"],
    locations: [
      {
        name: "Rotary Park",
        src: "https://maps.app.goo.gl/xP4Y9eaGmFHBozMv7",
        distanceFromCampus: 2,
      },
      {
        name: "Kiwanis Park Tennis Courts",
        src: "https://maps.app.goo.gl/1LmnH1zszKEH137p8",
        distanceFromCampus: "<1 mile",
      },
    ],
    timeOfDay: ["morning", "afternoon", "evening"],
    seasonalTimeframe: {
      months: [
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Go for a Walk or Hike",
    image: require("../../assets/images/date_ideas/walk_or_hike.png"),
    minDateNumber: 0,
    description:
      "Going for a walk is a great first date idea. It allows you to get to know another person while you enjoy nature!",
    locations: [
      {
        name: "Provo River Walk",
        src: "https://maps.app.goo.gl/PV5H1gpabcbpGDbeA",
        distanceFromCampus: 3,
      },
      {
        name: "Lakeshore Bridge Trailhead",
        src: "https://maps.app.goo.gl/XmaKap2qKnrDyw7x6",
        distanceFromCampus: 4,
      },
      {
        name: "The Y Hike",
        src: "https://www.hikethey.com/hike-the-y-trail/",
        distanceFromCampus: 1.5,
      },
    ],
    free: true,
    categories: ["Outdoors"],
    timeOfDay: ["morning", "afternoon", "evening"],
    seasonalTimeframe: {
      months: [
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Cook some food!",
    image: require("../../assets/images/date_ideas/cook.png"),
    minDateNumber: 0,
    categories: ["Cooking", "Food"],
    description:
      "All girls love when a man cooks for them! It's a great way to eat together without paying lots of money, and cooking WITH a girl can help you to get to know each other better too!",
    link: {
      text: "Click here for some recipe ideas!",
      url: "/recipes",
    },
    pricing: "$0-$20",
    majorRizz: true,
    timeOfDay: ["afternoon", "evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Skating",
    pricing: "$10-$15/person",
    majorRizz: true,
    image: require("../../assets/images/date_ideas/ice_skating.png"),
    minDateNumber: 0,
    categories: ["Recreation", "Sports"],
    description:
      "Skating is a great way to get to know a girl and learn a new skill!",
    locations: [
      {
        name: "Peaks Ice Arena",
        src: "https://www.provo.org/community/peaks-ice-arena",
        distanceFromCampus: 1.5,
      },
      {
        name: "Classic Skating",
        src: "https://classicfun.com/",
        distanceFromCampus: 4,
      },
    ],
    timeOfDay: ["afternoon", "evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: true,
  },
  {
    name: "Downtown Provo Events",
    description:
      "Living in Provo, you can find lots of events happening closeby! Many are free or very cheap and allow you to spend quality time with a girl.",
    image:
      "https://s3.us-east-1.amazonaws.com/bt-prod-img/place/Provo-Utah.jpg",
    minDateNumber: 1,
    categories: ["Recreation"],
    website:
      "https://www.provo.org/community/covey-center-for-the-arts/what-s-happening/events",
    distanceFromCampus: 1,
    timeOfDay: ["afternoon", "evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Carve Pumpkins!",
    description:
      "Carving pumpkins is great for being creative and also spending time with a girl!",
    minDateNumber: 0,
    categories: ["Cooking", "Recreation"],
    pricing: "$10-$20",
    image:
      "https://img.freepik.com/premium-photo/serious-young-multiethnic-couple-sitting-table-preparing-pumpkins-carving_622301-3359.jpg",
    timeOfDay: ["afternoon", "evening"],
    seasonalTimeframe: {
      months: ["October"],
    },
    CanUseSSC: false,
  },
  {
    name: "Rock Climbing",
    description:
      "Try indoor rock climbing or head outdoors for a more challenging experience. Test your strength and problem-solving skills together.",
    minDateNumber: 1,
    categories: ["Sports", "Outdoors"],
    pricing: "$20 - $50",
    image:
      "https://www.health.com/thmb/9SaajPUAjKpnlhdOQdrSalgO_9k=/2121x0/filters:no_upscale():max_bytes(150000):strip_icc()/RockClimbing-c7d67bffc2e44e9d836e7263eb52555c.jpg",
    locations: [
      {
        name: "The Quarry",
        src: "https://quarryclimbing.com/",
        distanceFromCampus: 2.5,
      },
    ],
    majorRizz: false,
    timeOfDay: ["morning", "afternoon", "evening"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: true,
  },
  {
    name: "Go-Kart Racing",
    description:
      "Race each other in go-karts on a nearby track. Compete for the fastest lap times while having a blast.",
    minDateNumber: 0,
    categories: ["Sports", "Recreation"],
    pricing: "$20 - $30",
    image:
      "https://www.k1speed.com/wp-content/uploads/2018/09/couple-racing-1024x683.jpg",
    locations: [
      {
        name: "Redline Racing",
        src: "https://redlineracingusa.com/",
        distanceFromCampus: 8,
      },
      {
        name: "The Grid Racing",
        src: "https://thegrid.com/",
        distanceFromCampus: 11,
      },
    ],
    majorRizz: false,
    timeOfDay: ["afternoon", "evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Shopping Trip",
    description:
      "Spend the day browsing through a local mall or shopping district, picking out new clothes or gadgets, and having fun together.",
    minDateNumber: 0,
    categories: ["Shopping", "Recreation"],
    pricing: "$0 - $100",
    image:
      "https://media.istockphoto.com/id/1369227756/photo/giggling-their-way-through-the-mall.jpg?s=612x612&w=0&k=20&c=QCk2FJg1m0bTFCOAvspDbCnM1p-NMMM7qdnPJXCwqH4=",
    locations: [
      {
        name: "Provo Town Center",
        src: "https://www.provotownecentre.com/",
        distanceFromCampus: 3,
      },
      {
        name: "University Place",
        src: "https://universityplaceorem.com/?utm_source=GMB&utm_medium=organic&utm_campaign=1SEO_SM",
        distanceFromCampus: 2,
      },
      {
        name: "IKEA",
        src: "https://www.ikea.com/us/en/stores/draper/",
        distanceFromCampus: 28,
      },
    ],
    timeOfDay: ["morning", "afternoon", "evening"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Museum Visit",
    description:
      "Explore a nearby museum to learn about art, history, or science. Spend the day discovering exhibits and engage in discussions.",
    minDateNumber: 0,
    categories: ["Learning", "Recreation"],
    pricing: "Free",
    free: true,
    image:
      "https://cdn.britannica.com/51/194651-050-747F0C18/Interior-National-Gallery-of-Art-Washington-DC.jpg",
    locations: [
      {
        name: "BYU Museum of Paleontology",
        src: "https://geology.byu.edu/museum-of-paleontology",
        distanceFromCampus: "<1 mile",
      },
      {
        name: "Bean Life Science Museum",
        src: "https://lsm.byu.edu/",
        distanceFromCampus: -1,
      },
      {
        name: "Museum of Mormon Mexican History",
        src: "https://museumofmormonmexicanhistory.com/",
        distanceFromCampus: "<1 mile",
      },
      {
        name: "Museum of Ancient Life",
        src: "https://thanksgivingpoint.org/attractions-tickets/museum-of-ancient-life/",
        distanceFromCampus: 20,
      },
      {
        name: "BYU Museum of Art",
        src: "http://moa.byu.edu/",
        distanceFromCampus: -1,
      },
      {
        name: "BYU Museum of Peoples and Cultures",
        src: "http://mpc.byu.edu/",
        distanceFromCampus: -1,
      },
      {
        name: "Education in Zion in the JFSB",
        src: "https://educationinzion.byu.edu/",
        distanceFromCampus: -1,
      },
    ],
    majorRizz: false,
    timeOfDay: ["morning", "afternoon", "evening"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Outdoor Picnic",
    description:
      "Enjoy a relaxing picnic at the local park with a blanket, snacks, and good company. You can bring your own food or grab something from a nearby café.",
    minDateNumber: 0,
    categories: ["Food", "Outdoors", "Recreation"],
    pricing: "Free to $20",
    image:
      "https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,h_900,q_75,w_1200/v1/clients/utahvalley/Picnictable_45577c44-ac66-4e51-a1c1-7282b080f301.jpg",
    locations: [
      {
        name: "Nielsen's Grove Park",
        src: "https://orem.org/nielsens-grove-park/",
        distanceFromCampus: 3.5,
      },
      {
        name: "Bridal Veil Picnic Area",
        src: "https://g.co/kgs/M1pt4hX",
        distanceFromCampus: 7.5,
      },
    ],
    majorRizz: false,
    timeOfDay: ["morning", "afternoon", "evening"],
    seasonalTimeframe: {
      months: [
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Top Golf",
    description: "Great fun for a small price!",
    pricing: "$30/person",
    image:
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/04/cc/08/8e/topgolf-the-colony.jpg?w=900&h=500&s=1",
    minDateNumber: 1,
    categories: ["Recreation"],
    website: "https://topgolf.com/us/vineyard/",
    distanceFromCampus: 7,
    timeOfDay: ["afternoon", "evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: false,
  },
  {
    name: "Comedy Shows",
    description:
      "Laugh together at a comedy show! Comedy is a great way to bond and have fun on a date!",
    minDateNumber: 1,
    categories: ["Entertainment", "Recreation"],
    pricing: "$10-$25/person",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop",
    locations: [
      {
        name: "Dry Bar Comedy",
        src: "https://www.drybarcomedy.com/",
        distanceFromCampus: "<1 mile",
      },
      {
        name: "ComedyBox Utah",
        src: "https://comedyboxutah.com/",
        distanceFromCampus: "<1 mile",
      },
      {
        name: "Improv Broadway",
        src: "https://improvbroadway.com/",
        distanceFromCampus: 1.5,
      },
    ],
    timeOfDay: ["evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: true,
  },
  {
    name: "Dancing",
    description:
      "Get your groove on together! Dancing is a fun and romantic way to connect and have a great time.",
    minDateNumber: 1,
    categories: ["Entertainment", "Recreation"],
    pricing: "$5-$15/person",
    image:
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=500&h=300&fit=crop",
    locations: [
      {
        name: "Salsa at Southworth",
        src: "https://salsaatsouthworth.com/",
        distanceFromCampus: "<1 mile",
      },
      {
        name: "Utah Country Dance",
        src: "https://utahcountrydance.com/",
        distanceFromCampus: "<1 mile",
      },
    ],
    timeOfDay: ["evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: true,
  },
  {
    name: "Pottery & Ceramics",
    description:
      "Get creative together with pottery and ceramics! It's a hands-on, fun activity that lets you create something beautiful together.",
    minDateNumber: 1,
    categories: ["Arts & Crafts", "Recreation"],
    pricing: "$15-$40/person",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop",
    locations: [
      {
        name: "Utah Center for the Ceramic Arts",
        src: "https://utahceramics.org/",
        distanceFromCampus: "<1 mile",
      },
      {
        name: "Kreative Kiln",
        src: "https://kreativekiln.com/",
        distanceFromCampus: 1.5,
      },
      {
        name: "Tilted Kiln",
        src: "https://tiltedkiln.com/",
        distanceFromCampus: 9,
      },
    ],
    timeOfDay: ["afternoon", "evening"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: true,
  },
  {
    name: "Bowling",
    description:
      "Strike up some fun with bowling! It's a classic date activity that's perfect for friendly competition and laughs.",
    minDateNumber: 0,
    categories: ["Entertainment", "Recreation"],
    pricing: "$8-$15/person",
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop",
    locations: [
      {
        name: "Fat Cats",
        src: "https://fatcatsfun.com/",
        distanceFromCampus: 1,
      },
      {
        name: "Miracle Bowl",
        src: "https://miraclebowl.com/",
        distanceFromCampus: 2.5,
      },
      {
        name: "Jack & Jill Lanes",
        src: "https://jackandjilllanes.com/",
        distanceFromCampus: 11.5,
      },
    ],
    timeOfDay: ["afternoon", "evening", "night"],
    seasonalTimeframe: {
      months: [
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
      ],
    },
    CanUseSSC: true,
  },
]

// Helper: parse SSC distance strings (e.g., "0.31Mi", "<1 mile") into numeric miles
const parseSSCDistance = (d) => {
  if (d === undefined || d === null) return undefined
  if (typeof d === "number") return d
  const s = String(d).trim()
  if (!s) return undefined
  if (s.includes("Mi") || s.toLowerCase().includes("mi")) {
    const num = parseFloat(s.replace(/[^0-9.]/g, ""))
    return isNaN(num) ? undefined : num
  }
  if (s.includes("<1") || s.toLowerCase().includes("<1 mile")) return 0.5
  const num = parseFloat(s.replace(/[^0-9.]/g, ""))
  return isNaN(num) ? undefined : num
}

// Build a combined list of SSC items with source category tags
const sscSources = [
  { list: burgers_and_sandwiches, category: "Food" },
  { list: entertainment, category: "Entertainment" },
  { list: free_deals, category: "Food" },
  { list: pizza, category: "Food" },
  { list: restaurants, category: "Food" },
  { list: treats_and_drinks, category: "Food" },
]

const allSSC = sscSources.flatMap((s) =>
  s.list.map((it) => ({ ...it, _category: s.category })),
)

// Group by normalized lower-case name
const grouped = allSSC.reduce((acc, item) => {
  const key = (item.name || "").trim().toLowerCase()
  if (!acc[key]) acc[key] = []
  acc[key].push(item)
  return acc
}, {})

const normalizedFromGroups = Object.keys(grouped).map((key) => {
  const group = grouped[key]
  // choose the first non-empty image, else fallback
  const img =
    group.find((g) => g.image && g.image !== "data:,")?.image ||
    require("../../assets/images/ssc.png")
  // parse distances and pick the minimum (closest)
  const distances = group
    .map((g) => parseSSCDistance(g.distance))
    .filter((d) => d !== undefined)
  const minDistance = distances.length ? Math.min(...distances) : undefined
  // count number of deals (each item has a 'deal' attribute)
  const dealsCount = group.length
  // pick pricing/free heuristics
  const anyFree = group.some(
    (g) => g.free === true || (g.pricing && /free/i.test(g.pricing)),
  )
  const pricing =
    group.find((g) => g.pricing && !/free/i.test(g.pricing))?.pricing ||
    (anyFree ? "Free" : undefined)
  // collect categories (dedupe)
  const categories = Array.from(
    new Set(group.map((g) => g._category).filter(Boolean)),
  )

  const uniqueDeals = Array.from(
    new Set(group.map((g) => g.deal).filter(Boolean)),
  )
  return {
    name: group[0].name,
    imgSrc: img,
    description: uniqueDeals[0] || group[0].deal,
    pricing: pricing,
    free: anyFree,
    locations:
      minDistance !== undefined
        ? [{ name: group[0].name, src: "", distanceFromCampus: minDistance }]
        : undefined,
    distanceFromCampus: minDistance,
    CanUseSSC: true,
    categories: categories.length ? categories : ["Food"],
    dealsCount: uniqueDeals.length,
    deals: uniqueDeals,
  }
})

export default dateideas
