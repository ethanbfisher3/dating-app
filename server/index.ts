const express = require("express")

// Node 18+ has a global fetch. Fallback to node-fetch for older runtimes.
const fetchFn =
  typeof globalThis.fetch === "function"
    ? globalThis.fetch.bind(globalThis)
    : (...args: [any, any?]) =>
        import("node-fetch").then(({ default: fetch }) => fetch(...args))

const app = express()
const port = 3000

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname })
})

app.get("/eventbriteapi", (req, res) => {
  const apiKey = process.env.EVENTBRITE_API_KEY
  const url = `https://www.eventbriteapi.com/v3/events/search/?q=dating&location.address=San+Francisco&token=${apiKey}`
  fetchFn(url)
    .then((response) => response.json())
    .then((data) => {
      res.json(data)
    })
    .catch((error) => {
      console.error("Error fetching data from Eventbrite API:", error)
      res
        .status(500)
        .json({ error: "Failed to fetch data from Eventbrite API" })
    })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
