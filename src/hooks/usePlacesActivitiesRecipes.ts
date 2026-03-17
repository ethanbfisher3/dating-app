import { useCallback, useEffect, useMemo, useState } from "react"
import type { PlannedDateResultsParams } from "../types/navigation"
import activities, { Activity } from "../data/activities"
import recipes, { Recipe } from "../data/Recipes"
import useBYUAPI, {
  BYUCalendarEvent,
  BYUCalendarEventsResponse,
} from "./useBYUAPI"
import type { DateCategory } from "src/utils/utils"

// Default location: BYU campus area (Provo, Utah)
const DEFAULT_USER_LOCATION = {
  latitude: 40.2444,
  longitude: -111.6435,
}

export type PlaceSummary = {
  id: string
  name: string
  address: string
  types: string[]
  googleMapsUri: string
  rating: number | null
  sourceKind: "place" | "activity" | "recipe"
  location?: {
    latitude: number | null
    longitude: number | null
  }
}

function toPlannerWindowBounds(params: PlannedDateResultsParams): {
  start: number
  end: number
  selectedDateKey: string
} | null {
  const parsed = new Date(`${toIsoDate(params.selectedDate)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const start = new Date(parsed)
  start.setHours(params.startHour, 0, 0, 0)

  const end = new Date(parsed)
  end.setHours(params.endHour, 0, 0, 0)
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1)
  }

  const selectedDateKey = `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1,
  ).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`

  return { start: start.getTime(), end: end.getTime(), selectedDateKey }
}

function filterBYUEventsByPlannerWindow(
  events: BYUEventSummary[],
  params: PlannedDateResultsParams,
): BYUEventSummary[] {
  const bounds = toPlannerWindowBounds(params)
  if (!bounds) {
    return events
  }

  return events.filter((event) => {
    if (!event.startDateTime) {
      return false
    }

    const eventStart = new Date(event.startDateTime).getTime()
    if (Number.isNaN(eventStart)) {
      return false
    }

    const eventStartDate = new Date(eventStart)
    const eventStartDateKey = `${eventStartDate.getFullYear()}-${String(
      eventStartDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(eventStartDate.getDate()).padStart(2, "0")}`
    if (eventStartDateKey !== bounds.selectedDateKey) {
      return false
    }

    const parsedEventEnd = event.endDateTime
      ? new Date(event.endDateTime).getTime()
      : Number.NaN
    const eventEnd =
      Number.isNaN(parsedEventEnd) || parsedEventEnd <= eventStart
        ? eventStart + 60 * 60 * 1000
        : parsedEventEnd

    return eventStart < bounds.end && eventEnd > bounds.start
  })
}

export type BYUEventSummary = {
  id: string
  title: string
  description: string
  startDateTime: string | null
  endDateTime: string | null
  location: string
  categories: string[]
  url: string
  price: number | null
}

type PlannerPlace = {
  id: string
  types?: string[]
  formattedAddress?: string
  googleMapsUri?: string
  rating?: number
  priceLevel?: string
  location?: { latitude?: number; longitude?: number }
  displayName?: { text?: string }
}

const CATEGORY_TYPE_MAP: Record<string, string[]> = {
  Food: [
    "restaurant",
    "meal_takeaway",
    "cafe",
    "bakery",
    "ice_cream_shop",
    "dessert_restaurant",
    "coffee_shop",
    "pizza_restaurant",
    "sandwich_shop",
  ],
  Outdoors: [
    "park",
    "hiking_area",
    "campground",
    "nature_preserve",
    "river",
    "lake",
    "scenic_spot",
  ],
  Sports: [
    "gym",
    "sports_club",
    "sports_complex",
    "sports_activity_location",
    "golf_course",
    "tennis_court",
  ],
  Nature: [
    "park",
    "hiking_area",
    "lake",
    "river",
    "nature_preserve",
    "mountain_peak",
    "tourist_attraction",
  ],
  Learning: ["museum", "library", "book_store", "art_gallery"],
  Shopping: [
    "shopping_mall",
    "department_store",
    "clothing_store",
    "gift_shop",
    "toy_store",
    "store",
  ],
  Recreation: [
    "movie_theater",
    "tourist_attraction",
    "video_arcade",
    "amusement_park",
    "playground",
    "bowling_alley",
  ],
}

const MONTHS = [
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
]

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const BYU_EVENTS_URL =
  "https://calendar.byu.edu/api/Events.json?categories=all&price=1000"

function normalizeBYUEvents(
  payload: BYUCalendarEventsResponse | BYUCalendarEvent[] | null,
): BYUCalendarEvent[] {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload.events)) {
    return payload.events
  }

  return []
}

function toBYUEventSummary(
  event: BYUCalendarEvent,
  index: number,
): BYUEventSummary {
  const title = (event as any).Title || event.title || `BYU Event ${index + 1}`
  const startDateTime = (event as any).StartDateTime || event.start || null
  const endDateTime = (event as any).EndDateTime || event.end || null
  const description =
    (event as any).Description || event.description || event.summary || ""
  const location = (event as any).Location || event.location || ""
  const url = (event as any).Url || (event as any).Link || event.url || ""
  const categoryId = (event as any).CategoryId
  const eventId = String(
    (event as any).EventId ?? event.id ?? `${title}_${index}`,
  )
  const priceRaw = (event as any).Price ?? event.price
  const parsedPrice =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string"
        ? Number.parseFloat(priceRaw)
        : Number.NaN

  return {
    id: eventId,
    title,
    description,
    startDateTime,
    endDateTime,
    location,
    categories:
      categoryId !== undefined && categoryId !== null
        ? [String(categoryId)]
        : Array.isArray(event.categories)
          ? event.categories
          : [],
    url,
    price: Number.isNaN(parsedPrice) ? null : parsedPrice,
  }
}

function toBYUEventPlaceSummary(event: BYUEventSummary): PlaceSummary {
  return {
    id: `byu_event_${event.id}`,
    name: event.title,
    address: event.location,
    types: ["tourist_attraction", "event", "byu_event"],
    googleMapsUri: event.url,
    rating: null,
    sourceKind: "place",
    location: {
      latitude: null,
      longitude: null,
    },
  }
}

function normalizeHour12(hour12: number, period: string): number {
  const hour = hour12 % 12
  return period.toUpperCase() === "PM" ? hour + 12 : hour
}

function isActivityTimeCompatible(
  activity: Activity,
  startHour: number,
  endHour: number,
): boolean {
  if (
    !Array.isArray(activity.bestTimesOfDay) ||
    !activity.bestTimesOfDay.length
  ) {
    return true
  }

  const dateStart = startHour * 60
  let dateEnd = endHour * 60
  if (dateEnd <= dateStart) {
    dateEnd += 24 * 60
  }

  return activity.bestTimesOfDay.some((range) => {
    const rangeStartHour = Number.parseInt(range.startHour12, 10)
    const rangeEndHour = Number.parseInt(range.endHour12, 10)
    if (Number.isNaN(rangeStartHour) || Number.isNaN(rangeEndHour)) {
      return true
    }

    const start = normalizeHour12(rangeStartHour, range.startPeriod) * 60
    let end = normalizeHour12(rangeEndHour, range.endPeriod) * 60
    if (end <= start) {
      end += 24 * 60
    }

    return start < dateEnd && end > dateStart
  })
}

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMiles * c
}

function loadLocalPlacesData(): PlannerPlace[] {
  try {
    const localJson = require("../data/places/places.json")
    const data = localJson?.default ?? localJson
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function getPlaceName(place: PlannerPlace): string {
  return place.displayName?.text || "Unknown place"
}

function toPlaceSummary(place: PlannerPlace): PlaceSummary {
  return {
    id: place.id,
    name: getPlaceName(place),
    address: place.formattedAddress || "",
    types: Array.isArray(place.types) ? place.types : [],
    googleMapsUri: place.googleMapsUri || "",
    rating: typeof place.rating === "number" ? place.rating : null,
    sourceKind: "place",
    location: {
      latitude:
        typeof place.location?.latitude === "number"
          ? place.location.latitude
          : null,
      longitude:
        typeof place.location?.longitude === "number"
          ? place.location.longitude
          : null,
    },
  }
}

function placeMatchesCategories(
  place: PlannerPlace,
  categories: string[],
): boolean {
  const typeSet = new Set(Array.isArray(place.types) ? place.types : [])
  return categories.some((category) => {
    const allowedTypes = CATEGORY_TYPE_MAP[category] || []
    return allowedTypes.some((type) => typeSet.has(type))
  })
}

const getAvailableAtHomeIdeas = (
  params: PlannedDateResultsParams,
): {
  recipes: Recipe[]
  activities: Activity[]
} => {
  const budget =
    typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)
      ? params.maxPrice
      : Number.POSITIVE_INFINITY

  const totalMinutes = computeWindowDurationMinutes(
    params.startHour,
    params.endHour,
  )

  const parsedDate = new Date(`${toIsoDate(params.selectedDate)}T12:00:00`)
  const monthName = MONTHS[parsedDate.getMonth()] || ""
  const weekdayName = DAYS[parsedDate.getDay()] || ""

  const affordableRecipes = recipes.filter(
    (recipe) =>
      params.categories.includes("Food") &&
      recipe.estimatedPrice <= budget &&
      recipe.estimatedTime <= totalMinutes,
  )

  const affordableActivities = activities
    .filter((activity) => activity.cost <= budget)
    .filter((activity) =>
      activity.categories.some((category) =>
        params.categories.includes(category as DateCategory),
      ),
    )
    .filter((activity) => {
      const minDuration = activity.durationMinutes?.min ?? 0
      return minDuration <= totalMinutes
    })
    .filter((activity) => {
      if (!activity.bestMonthsOfYear?.length) {
        return true
      }

      return monthName ? activity.bestMonthsOfYear.includes(monthName) : true
    })
    .filter((activity) => {
      if (!activity.bestDaysOfWeek?.length) {
        return true
      }

      return weekdayName ? activity.bestDaysOfWeek.includes(weekdayName) : true
    })
    .filter((activity) =>
      isActivityTimeCompatible(activity, params.startHour, params.endHour),
    )

  return { recipes: affordableRecipes, activities: affordableActivities }
}

function computeWindowDurationMinutes(startHour: number, endHour: number) {
  const start = startHour * 60
  let end = endHour * 60
  if (end <= start) end += 24 * 60
  return end - start
}

function toIsoDate(dateString: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }

  return parsed.toISOString().slice(0, 10)
}

export default function useDatePlannerIdeas(params: PlannedDateResultsParams): {
  places: PlaceSummary[]
  recipes: Recipe[]
  activities: Activity[]
  byuEvents: BYUEventSummary[]
  sourceFile: string
  isLoading: boolean
  error: string | null
  refetch: () => void
} {
  const [matchedPlaces, setMatchedPlaces] = useState<PlaceSummary[]>([])
  const [sourceFile, setSourceFile] = useState("src/data/places/places.json")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const byuEventsRaw = useBYUAPI<
    BYUCalendarEventsResponse | BYUCalendarEvent[]
  >(BYU_EVENTS_URL, params)

  const atHomeOptions = useMemo(() => getAvailableAtHomeIdeas(params), [params])

  const byuEvents = useMemo(
    () =>
      filterBYUEventsByPlannerWindow(
        normalizeBYUEvents(byuEventsRaw).map(toBYUEventSummary),
        params,
      ),
    [byuEventsRaw, params],
  )

  const byuEventPlaces = useMemo(
    () => byuEvents.map(toBYUEventPlaceSummary),
    [byuEvents],
  )

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (params.maxDistance <= 0) {
        setMatchedPlaces([])
        setSourceFile(byuEventPlaces.length ? "BYU Calendar API" : "")
      } else {
        const localPlaces = loadLocalPlacesData()

        // Use user's location or default to BYU/Provo area
        const userLocationForFiltering =
          params.userLocation || DEFAULT_USER_LOCATION

        const filteredLocalPlaces = localPlaces
          .filter((place) => placeMatchesCategories(place, params.categories))
          .filter((place) => {
            const latitude = place.location?.latitude
            const longitude = place.location?.longitude

            // Only include places that have valid coordinates
            if (typeof latitude !== "number" || typeof longitude !== "number") {
              return false
            }

            const milesAway = haversineMiles(
              userLocationForFiltering.latitude,
              userLocationForFiltering.longitude,
              latitude,
              longitude,
            )

            return milesAway <= params.maxDistance
          })
          .map(toPlaceSummary)

        const combinedPlaces = dedupePlaceSummariesById([
          ...filteredLocalPlaces,
          ...byuEventPlaces,
        ])

        setMatchedPlaces(combinedPlaces)
        setSourceFile(
          byuEventPlaces.length
            ? "src/data/places/places.json + BYU Calendar API"
            : "src/data/places/places.json",
        )
      }
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch date planner ideas.")
      setMatchedPlaces([])
      setSourceFile("")
    } finally {
      setIsLoading(false)
    }
  }, [params, byuEventPlaces])

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  return {
    places: matchedPlaces,
    recipes: atHomeOptions.recipes,
    activities: atHomeOptions.activities,
    byuEvents,
    sourceFile,
    isLoading,
    error,
    refetch: fetchIdeas,
  }
}

function dedupePlaceSummariesById(places: PlaceSummary[]): PlaceSummary[] {
  const seen = new Set<string>()
  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false
    }

    seen.add(place.id)
    return true
  })
}

export { useDatePlannerIdeas }
