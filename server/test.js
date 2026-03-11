function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8 // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
function generateSearchGrid(centerLat, centerLng, maxRadiusMiles) {
  const points = []
  const milesPerLat = 69
  const milesPerLng = Math.cos((centerLat * Math.PI) / 180) * 69

  // Step by 20 miles. We use a 15-mile search radius (24,140 meters) to ensure overlap.
  const stepMiles = 20
  const searchRadiusMeters = 24140

  const latStep = stepMiles / milesPerLat
  const lngStep = stepMiles / milesPerLng

  const latBound = maxRadiusMiles / milesPerLat
  const lngBound = maxRadiusMiles / milesPerLng

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
        })
      }
    }
  }
  return points
}

console.log(require("./types.ts").length)
