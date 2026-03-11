const express = require("express")
const env = require("dotenv")
const categories = require("./categories")
const { getDatePlannerIdeas } = require("./datePlanner")
env.config()

// Node 18+ has a global fetch. Fallback to node-fetch for older runtimes.
const fetchFn =
  typeof globalThis.fetch === "function"
    ? globalThis.fetch.bind(globalThis)
    : (...args: [any, any?]) =>
        import("node-fetch").then(({ default: fetch }) => fetch(...args))

const app = express()
const port = 3000
let eventbriteAccessToken: string | null = null

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.sendStatus(204)
  }

  next()
})

const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY
const EVENTBRITE_CLIENT_SECRET = process.env.EVENTBRITE_CLIENT_SECRET
const EVENTBRITE_REDIRECT_URI = process.env.EVENTBRITE_REDIRECT_URI?.trim()

function getEventbriteRedirectUri(): string {
  if (!EVENTBRITE_REDIRECT_URI) {
    throw new Error(
      "Missing EVENTBRITE_REDIRECT_URI. Set it exactly to your Eventbrite app Redirect URI (example: http://localhost:3000/eventbrite/callback).",
    )
  }

  let parsed: URL
  try {
    parsed = new URL(EVENTBRITE_REDIRECT_URI)
  } catch {
    throw new Error(
      "Invalid EVENTBRITE_REDIRECT_URI. It must be a full URL including protocol and hostname.",
    )
  }

  if (!parsed.hostname) {
    throw new Error(
      "Invalid EVENTBRITE_REDIRECT_URI. Hostname is required and must match Eventbrite app settings.",
    )
  }

  return parsed.toString()
}

function buildEventbriteAuthorizeUrl(redirectUri: string): string {
  const authUrl = new URL("https://www.eventbrite.com/oauth/authorize")
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("client_id", EVENTBRITE_API_KEY || "")
  authUrl.searchParams.set("redirect_uri", redirectUri)
  return authUrl.toString()
}

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname })
})

app.get("/eventbrite/authorize", (req, res) => {
  if (!EVENTBRITE_API_KEY) {
    return res.status(500).json({
      error: "Missing EVENTBRITE_API_KEY",
    })
  }

  let redirectUri: string
  try {
    redirectUri = getEventbriteRedirectUri()
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }

  const authUrl = buildEventbriteAuthorizeUrl(redirectUri)

  res.redirect(authUrl)
})

app.get("/eventbrite/config", (req, res) => {
  let redirectUri: string | null = null
  let redirectHost: string | null = null
  let configError: string | null = null

  try {
    redirectUri = getEventbriteRedirectUri()
    redirectHost = new URL(redirectUri).hostname
  } catch (error: any) {
    configError = error.message
  }

  const authorizeUrl =
    redirectUri && EVENTBRITE_API_KEY
      ? buildEventbriteAuthorizeUrl(redirectUri)
      : null

  res.json({
    hasApiKey: Boolean(EVENTBRITE_API_KEY),
    hasClientSecret: Boolean(EVENTBRITE_CLIENT_SECRET),
    redirectUri,
    redirectHost,
    authorizeUrl,
    configError,
    note: "The redirectUri hostname must exactly match the redirect URI hostname configured in your Eventbrite app.",
  })
})

app.get("/eventbrite/callback", async (req, res) => {
  let redirectUri: string
  try {
    redirectUri = getEventbriteRedirectUri()
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
  const code = typeof req.query.code === "string" ? req.query.code : undefined

  if (!code) {
    return res.status(400).json({
      error: "Missing OAuth code in query parameter",
    })
  }

  if (!EVENTBRITE_API_KEY || !EVENTBRITE_CLIENT_SECRET) {
    return res.status(500).json({
      error:
        "Missing EVENTBRITE_API_KEY or EVENTBRITE_CLIENT_SECRET in environment",
    })
  }

  try {
    const tokenResponse = await getEventbriteToken({
      clientId: EVENTBRITE_API_KEY,
      clientSecret: EVENTBRITE_CLIENT_SECRET,
      code,
      redirectUri,
    })

    eventbriteAccessToken = tokenResponse.access_token

    res.json({
      message: "Eventbrite authorization successful",
      tokenType: tokenResponse.token_type,
      expiresIn: tokenResponse.expires_in,
      hasRefreshToken: Boolean(tokenResponse.refresh_token),
    })
  } catch (error) {
    console.error("Error obtaining Eventbrite token:", error)
    res.status(500).json({
      error: "Failed to obtain Eventbrite token",
      redirectUri,
    })
  }
})

function getEventbriteAccessToken(): string | null {
  return eventbriteAccessToken || process.env.EVENTBRITE_PRIVATE_TOKEN || null
}

app.get("/eventbrite/categories", (req, res) => {
  res.json({ categories })
})

app.get("/eventbrite/events", async (req, res) => {
  const accessToken = getEventbriteAccessToken()

  if (!accessToken) {
    return res.status(401).json({
      error:
        "No access token. Authorize via /eventbrite/authorize or set EVENTBRITE_PRIVATE_TOKEN.",
    })
  }

  const categoryId =
    typeof req.query.categoryId === "string" ? req.query.categoryId.trim() : ""
  const rangeStart =
    typeof req.query.rangeStart === "string" ? req.query.rangeStart.trim() : ""
  const rangeEnd =
    typeof req.query.rangeEnd === "string" ? req.query.rangeEnd.trim() : ""
  const pageRaw =
    typeof req.query.page === "string" ? req.query.page.trim() : "1"
  const pageSizeRaw =
    typeof req.query.pageSize === "string" ? req.query.pageSize.trim() : "20"
  const page = Number.parseInt(pageRaw, 10)
  const pageSize = Number.parseInt(pageSizeRaw, 10)

  if (!categoryId || !rangeStart || !rangeEnd) {
    return res.status(400).json({
      error:
        "Missing required query parameters: categoryId, rangeStart, rangeEnd",
      example:
        "/eventbrite/events?categoryId=103&rangeStart=2026-03-01T00:00:00Z&rangeEnd=2026-03-31T23:59:59Z",
    })
  }

  if (
    Number.isNaN(page) ||
    Number.isNaN(pageSize) ||
    page < 1 ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    return res.status(400).json({
      error:
        "Invalid pagination. page must be >= 1 and pageSize must be between 1 and 100.",
      example:
        "/eventbrite/events?categoryId=103&rangeStart=2026-03-01T00:00:00Z&rangeEnd=2026-03-31T23:59:59Z&page=1&pageSize=20",
    })
  }

  const searchUrl = new URL("https://www.eventbriteapi.com/v3/events/search/")
  searchUrl.searchParams.set("categories", categoryId)
  searchUrl.searchParams.set("start_date", rangeStart)
  searchUrl.searchParams.set("end_date", rangeEnd)
  searchUrl.searchParams.set("expand", "venue")
  searchUrl.searchParams.set("page", page.toString())
  searchUrl.searchParams.set("page_size", pageSize.toString())

  try {
    const searchResponse = await fetchFn(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const searchData = await searchResponse.json()

    if (searchResponse.ok) {
      return res.json({
        ...searchData,
        source: "event_search",
      })
    }

    if (searchResponse.status !== 404) {
      return res.status(searchResponse.status).json({
        ...searchData,
        attemptedUrl: searchUrl.toString(),
      })
    }

    let meCheck: any = null
    try {
      const meResponse = await fetchFn(
        "https://www.eventbriteapi.com/v3/users/me/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      meCheck = {
        status: meResponse.status,
        body: await meResponse.json(),
      }
    } catch {
      meCheck = {
        status: null,
        body: { error: "users/me validation failed" },
      }
    }

    const fallbackCandidates: Array<{ type: string; url: URL }> = []

    let organizationsDiscoveryStatus: number | null = null
    let discoveredOrganizationIds: string[] = []

    try {
      const orgsResponse = await fetchFn(
        "https://www.eventbriteapi.com/v3/users/me/organizations/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      organizationsDiscoveryStatus = orgsResponse.status

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        const organizations = Array.isArray(orgsData.organizations)
          ? orgsData.organizations
          : []

        for (const organization of organizations) {
          const organizationId = organization?.id ? String(organization.id) : ""
          if (!organizationId) {
            continue
          }

          discoveredOrganizationIds.push(organizationId)

          const alreadyAdded = fallbackCandidates.some(
            (candidate) =>
              candidate.url.pathname ===
              `/v3/organizations/${organizationId}/events/`,
          )

          if (!alreadyAdded) {
            fallbackCandidates.push({
              type: "organization_events_discovered",
              url: new URL(
                `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`,
              ),
            })
          }
        }
      }
    } catch {
      // Best-effort discovery only.
    }

    if (!fallbackCandidates.length) {
      return res.status(404).json({
        error:
          "No organization event endpoints available. Use a token tied to an organizer account.",
        fallbackFrom: searchUrl.toString(),
        tokenDiagnostic: {
          usersMeCheck: meCheck,
          organizationsDiscoveryStatus,
          discoveredOrganizationIds,
        },
      })
    }

    const fallbackAttemptResults: Array<{
      type: string
      url: string
      status: number
    }> = []
    let fallbackData: any = null
    let fallbackType: string | null = null
    let fallbackUrlString: string | null = null

    for (const candidate of fallbackCandidates) {
      candidate.url.searchParams.set("page", page.toString())
      candidate.url.searchParams.set("page_size", pageSize.toString())
      candidate.url.searchParams.set("expand", "venue")

      const candidateResponse = await fetchFn(candidate.url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      fallbackAttemptResults.push({
        type: candidate.type,
        url: candidate.url.toString(),
        status: candidateResponse.status,
      })

      const candidateData = await candidateResponse.json()

      if (candidateResponse.ok) {
        fallbackData = candidateData
        fallbackType = candidate.type
        fallbackUrlString = candidate.url.toString()
        break
      }
    }

    if (!fallbackData || !fallbackType || !fallbackUrlString) {
      return res.status(404).json({
        error: "All organization fallback endpoints failed for this token.",
        fallbackFrom: searchUrl.toString(),
        tokenDiagnostic: {
          usersMeCheck: meCheck,
          organizationsDiscoveryStatus,
          discoveredOrganizationIds,
          attempts: fallbackAttemptResults,
        },
      })
    }

    const rangeStartMs = Date.parse(rangeStart)
    const rangeEndMs = Date.parse(rangeEnd)

    if (Number.isNaN(rangeStartMs) || Number.isNaN(rangeEndMs)) {
      return res.status(400).json({
        error: "Invalid date range format. Use UTC ISO timestamps.",
        example:
          "/eventbrite/events?categoryId=103&rangeStart=2026-03-01T00:00:00Z&rangeEnd=2026-03-31T23:59:59Z",
      })
    }

    const events = Array.isArray(fallbackData.events) ? fallbackData.events : []

    const filteredEvents = events.filter((event: any) => {
      const eventCategoryId = String(event?.category_id || "")
      const eventStartUtc = event?.start?.utc
      const eventStartMs = Date.parse(eventStartUtc || "")

      if (!eventCategoryId || Number.isNaN(eventStartMs)) {
        return false
      }

      return (
        eventCategoryId === categoryId &&
        eventStartMs >= rangeStartMs &&
        eventStartMs <= rangeEndMs
      )
    })

    return res.json({
      source: fallbackType,
      fallbackReason:
        "Event search endpoint returned 404; filtered events from fallback endpoint instead.",
      attemptedSearchUrl: searchUrl.toString(),
      attemptedFallbackUrl: fallbackUrlString,
      pagination: fallbackData.pagination,
      events: filteredEvents,
    })
  } catch (error) {
    console.error("Error fetching Eventbrite events by category:", error)
    return res.status(500).json({
      error: "Failed to fetch Eventbrite events by category",
    })
  }
})

app.get("/date-planner/ideas", async (req, res) => {
  try {
    const categoriesRaw = req.query.categories
    const categoriesQuery = Array.isArray(categoriesRaw)
      ? categoriesRaw.join(",")
      : typeof categoriesRaw === "string"
        ? categoriesRaw
        : ""

    const categories = categoriesQuery
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    const date = typeof req.query.date === "string" ? req.query.date.trim() : ""
    const startHourRaw =
      typeof req.query.startHour === "string" ? req.query.startHour.trim() : ""
    const endHourRaw =
      typeof req.query.endHour === "string" ? req.query.endHour.trim() : ""
    const ideaCountRaw =
      typeof req.query.ideaCount === "string"
        ? req.query.ideaCount.trim()
        : "10"
    const maxPriceRaw =
      typeof req.query.maxPrice === "string" ? req.query.maxPrice.trim() : ""
    const maxDistanceMilesRaw =
      typeof req.query.maxDistanceMiles === "string"
        ? req.query.maxDistanceMiles.trim()
        : ""

    const startHour = Number.parseInt(startHourRaw, 10)
    const endHour = Number.parseInt(endHourRaw, 10)
    const ideaCountParsed = Number.parseInt(ideaCountRaw, 10)
    const maxPriceParsed = Number.parseFloat(maxPriceRaw)
    const maxDistanceMilesParsed = Number.parseFloat(maxDistanceMilesRaw)
    const ideaCount = Number.isNaN(ideaCountParsed)
      ? 10
      : Math.max(1, Math.min(20, ideaCountParsed))
    const maxPrice =
      Number.isNaN(maxPriceParsed) || maxPriceParsed < 0
        ? undefined
        : maxPriceParsed
    const maxDistanceMiles =
      Number.isNaN(maxDistanceMilesParsed) || maxDistanceMilesParsed < 0
        ? undefined
        : maxDistanceMilesParsed

    const userLatitudeRaw =
      typeof req.query.userLatitude === "string"
        ? req.query.userLatitude.trim()
        : ""
    const userLongitudeRaw =
      typeof req.query.userLongitude === "string"
        ? req.query.userLongitude.trim()
        : ""
    const userLatitude = Number.parseFloat(userLatitudeRaw)
    const userLongitude = Number.parseFloat(userLongitudeRaw)
    const hasUserLocation =
      !Number.isNaN(userLatitude) && !Number.isNaN(userLongitude)

    if (!date || Number.isNaN(startHour) || Number.isNaN(endHour)) {
      return res.status(400).json({
        error:
          "Missing or invalid required query params: date (YYYY-MM-DD), startHour (0-23), endHour (0-23)",
        example:
          "/date-planner/ideas?categories=Food,Outdoors&date=2026-03-15&startHour=18&endHour=21&ideaCount=10",
      })
    }

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      return res.status(400).json({
        error: "startHour and endHour must be between 0 and 23.",
      })
    }

    const result = await getDatePlannerIdeas({
      categories,
      date,
      startHour,
      endHour,
      ideaCount,
      maxPrice,
      maxDistanceMiles,
      userLatitude: hasUserLocation ? userLatitude : undefined,
      userLongitude: hasUserLocation ? userLongitude : undefined,
    })

    return res.json({
      request: {
        categories,
        date,
        startHour,
        endHour,
        ideaCount,
        maxPrice: maxPrice ?? null,
        maxDistanceMiles: maxDistanceMiles ?? null,
        userLatitude: hasUserLocation ? userLatitude : null,
        userLongitude: hasUserLocation ? userLongitude : null,
      },
      ...result,
    })
  } catch (error: any) {
    console.error("Date planner query failed:", error)
    return res.status(500).json({
      error: error?.message || "Failed to generate date planner ideas.",
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

type EventbriteTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

async function getEventbriteToken(params: {
  clientId: string
  clientSecret: string
  code: string
  redirectUri: string
}): Promise<EventbriteTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
  })

  const response = await fetchFn("https://www.eventbrite.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Eventbrite token request failed: ${response.status} ${text}`,
    )
  }

  return response.json()
}

// Example usage (do not run at module load):
// getEventbriteToken({
//   clientId: process.env.EVENTBRITE_API_KEY!,
//   clientSecret: process.env.EVENTBRITE_CLIENT_SECRET!,
//   code: "example code",
//   redirectUri: "https://yourapp.com/callback",
// }).then((token) => {
//   console.log(token.access_token);
// });
