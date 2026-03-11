import dotenv from "dotenv";
dotenv.config();
import fs from "fs/promises";
import searchPoints from "./searchPoints.ts";

const reset = "\x1b[0m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";

// 1. Delay helper (Crucial to avoid 429 Too Many Requests errors from Google)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const gridPoints = searchPoints;
  console.log(
    `Generated ${gridPoints.length} map coordinates to cover 50 miles.`,
  );

  // We use a Map to automatically remove duplicates from overlapping circles
  const allPlacesMap = new Map();
  let apiCallsMade = 0;

  for (const point of gridPoints) {
    console.log("Searching: " + point.name);
    for (const search of point.searches) {
      const { placeType, searchRadius } = search;
      apiCallsMade++;
      console.log(
        `Call ${apiCallsMade}: Searching for ${placeType} at ${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)}`,
      );

      const requestBody = {
        includedTypes: [placeType],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: point.latitude, longitude: point.longitude },
            radius: searchRadius,
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
                "places.id,places.displayName,places.regularOpeningHours,places.formattedAddress,places.location,places.googleMapsUri,places.types," +
                "places.primaryType,places.businessStatus,places.addressComponents,places.currentOpeningHours,places.rating,places.priceLevel,",
            },
            body: JSON.stringify(requestBody),
          },
        );

        const data = await response.json();

        if (data.places && data.places.length === 20)
          console.warn(
            red +
              "Max places reached for point: " +
              point.latitude +
              ", " +
              point.longitude +
              " and place type: " +
              placeType +
              reset,
          );
        if (!data.places || data.places.length === 0)
          console.log(
            yellow +
              "Nothing found at point: " +
              point.latitude +
              ", " +
              point.longitude +
              " for place type: " +
              placeType +
              reset +
              "data: " +
              JSON.stringify(data),
          );

        // TODO add information about the type that was searched for to the place object so we can filter by it later if we want to
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
