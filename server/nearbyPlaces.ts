require("dotenv").config();
const types = require("./types.ts");
const fs = require("fs/promises");

// 1. Delay helper (Crucial to avoid 429 Too Many Requests errors from Google)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 2. Haversine formula to check if a coordinate is within 50 miles
function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 3. Generate the overlapping search coordinates
function generateSearchGrid(centerLat, centerLng, maxRadiusMiles) {
  const points = [];
  const milesPerLat = 69;
  const milesPerLng = Math.cos((centerLat * Math.PI) / 180) * 69;

  // Step by 20 miles. We use a 15-mile search radius (24,140 meters) to ensure overlap.
  const stepMiles = 20;
  const searchRadiusMeters = 24140;

  const latStep = stepMiles / milesPerLat;
  const lngStep = stepMiles / milesPerLng;

  const latBound = maxRadiusMiles / milesPerLat;
  const lngBound = maxRadiusMiles / milesPerLng;

  for (
    let lat = centerLat - latBound;
    lat <= centerLat + latBound;
    lat += latStep
  ) {
    for (
      let lng = centerLng - lngBound;
      lng <= centerLng + lngBound;
      lng += lngStep
    ) {
      // Only keep the point if it sits within the requested radius from your center
      if (
        getDistanceInMiles(centerLat, centerLng, lat, lng) <= maxRadiusMiles
      ) {
        points.push({
          latitude: lat,
          longitude: lng,
          radius: searchRadiusMeters,
        });
      }
    }
  }
  return points;
}

// 4. File naming helper
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getAvailableFileName(baseName) {
  let counter = 1;
  let fileName = `${baseName}.json`;
  let fileExists = true;

  while (fileExists) {
    try {
      await fs.access(fileName);
      counter++;
      fileName = `${baseName}_${counter}.json`;
    } catch (error) {
      fileExists = false;
    }
  }
  return fileName;
}

// 5. The Main Execution
async function runMassiveSearch() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const centerLat = 40.253086;
  const centerLng = -111.6558205;

  // Changed to 50 miles here
  const gridPoints = generateSearchGrid(centerLat, centerLng, 50);
  console.log(
    `Generated ${gridPoints.length} map coordinates to cover 50 miles.`,
  );

  // We use a Map to automatically remove duplicates from overlapping circles
  const allPlacesMap = new Map();
  let apiCallsMade = 0;

  for (const point of gridPoints) {
    for (const type of types) {
      apiCallsMade++;
      console.log(
        `Call ${apiCallsMade}: Searching for ${type} at ${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)}`,
      );

      const requestBody = {
        includedTypes: [type],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: point.latitude, longitude: point.longitude },
            radius: point.radius,
          },
        },
      };

      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchNearby",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.regularOpeningHours,places.formattedAddress,places.location,places.googleMapsUri",
            },
            body: JSON.stringify(requestBody),
          },
        );

        const data = await response.json();

        if (data.places) {
          data.places.forEach((place) => {
            if (!allPlacesMap.has(place.id)) {
              allPlacesMap.set(place.id, place);
            }
          });
        }

        // Wait 300 milliseconds between calls so Google doesn't block the API key
        await delay(300);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  }

  // Convert the Map back to an array to save it
  const finalPlacesArray = Array.from(allPlacesMap.values());

  if (finalPlacesArray.length > 0) {
    const jsonContent = JSON.stringify(finalPlacesArray, null, 2);
    const dateString = getFormattedDate();
    const finalFileName = await getAvailableFileName(`places_${dateString}`);

    await fs.writeFile(finalFileName, jsonContent, "utf8");
    console.log(`\n✅ Success! Made ${apiCallsMade} API calls.`);
    console.log(
      `✅ Filtered duplicates and saved ${finalPlacesArray.length} unique places to ${finalFileName}`,
    );
  } else {
    console.log("No places found.");
  }
}

runMassiveSearch();
