import { useState, useEffect } from "react"
import type { PlannedDateResultsParams } from "../types/navigation"

export type BYUCalendarEvent = {
  id?: number | string
  EventId?: number | string
  title?: string
  Title?: string
  description?: string
  Description?: string
  summary?: string
  start?: string
  StartDateTime?: string
  end?: string
  EndDateTime?: string
  location?: string
  Location?: string
  all_day?: boolean
  categories?: string[]
  CategoryId?: number | string
  url?: string
  Url?: string
  Link?: string
  image_url?: string
  price?: number | string
  Price?: number | string
}

export type BYUCalendarEventsResponse = {
  events?: BYUCalendarEvent[]
  [key: string]: unknown
}

function toWindowBounds(params: PlannedDateResultsParams): {
  start: number
  end: number
  selectedDateKey: string
} | null {
  const selectedDateText = params.selectedDate
  const base = /^\d{4}-\d{2}-\d{2}$/.test(selectedDateText)
    ? new Date(`${selectedDateText}T00:00:00`)
    : new Date(selectedDateText)
  if (Number.isNaN(base.getTime())) {
    return null
  }

  const start = new Date(base)
  start.setHours(params.startHour, 0, 0, 0)

  const end = new Date(base)
  end.setHours(params.endHour, 0, 0, 0)
  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1)
  }

  const selectedDateKey = `${base.getFullYear()}-${String(
    base.getMonth() + 1,
  ).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`

  return { start: start.getTime(), end: end.getTime(), selectedDateKey }
}

function intersectsWindow(
  event: BYUCalendarEvent,
  windowStart: number,
  windowEnd: number,
  selectedDateKey: string,
): boolean {
  const rawStart = event.StartDateTime || event.start
  const rawEnd = event.EndDateTime || event.end
  if (!rawStart) {
    return false
  }

  const eventStart = new Date(rawStart).getTime()
  if (Number.isNaN(eventStart)) {
    return false
  }

  const eventStartDate = new Date(eventStart)
  const eventStartDateKey = `${eventStartDate.getFullYear()}-${String(
    eventStartDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(eventStartDate.getDate()).padStart(2, "0")}`
  if (eventStartDateKey !== selectedDateKey) {
    return false
  }

  const parsedEnd = rawEnd ? new Date(rawEnd).getTime() : Number.NaN
  let eventEnd = Number.isNaN(parsedEnd)
    ? eventStart + 60 * 60 * 1000
    : parsedEnd

  if (eventEnd <= eventStart) {
    eventEnd = eventStart + 60 * 60 * 1000
  }

  return eventStart < windowEnd && eventEnd > windowStart
}

function filterByPlannerWindow(
  payload: BYUCalendarEventsResponse | BYUCalendarEvent[],
  params: PlannedDateResultsParams,
): BYUCalendarEventsResponse | BYUCalendarEvent[] {
  const bounds = toWindowBounds(params)
  if (!bounds) {
    return payload
  }

  const filterEvents = (events: BYUCalendarEvent[]) =>
    events.filter((event) =>
      intersectsWindow(event, bounds.start, bounds.end, bounds.selectedDateKey),
    )

  if (Array.isArray(payload)) {
    return filterEvents(payload)
  }

  if (Array.isArray(payload.events)) {
    return {
      ...payload,
      events: filterEvents(payload.events),
    }
  }

  return payload
}

export const useBYUAPIPost = <TResponse = unknown, TBody = unknown>(
  url: string,
  info: TBody,
): TResponse | null => {
  const [data, setData] = useState<TResponse | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(info),
      })
      const json = (await response.json()) as TResponse
      setData(json)
    }

    fetchData()
  }, [url, info])

  return data
}

const useAPI = <TResponse = unknown>(
  url: string,
  plannerParams?: PlannedDateResultsParams,
): TResponse | null => {
  const [data, setData] = useState<TResponse | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(url)
      const json = (await response.json()) as TResponse

      if (plannerParams) {
        const maybeEvents = json as unknown as
          | BYUCalendarEventsResponse
          | BYUCalendarEvent[]
        const filtered = filterByPlannerWindow(maybeEvents, plannerParams)
        setData(filtered as unknown as TResponse)
        return
      }

      setData(json)
    }

    fetchData()
  }, [url, plannerParams])

  return data
}

export default useAPI
