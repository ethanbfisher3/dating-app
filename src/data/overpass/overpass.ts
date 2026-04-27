import type { DateCategory } from "../../utils/utils";

const dateCategoryToNodes: Record<DateCategory, string[]> = {
  Food: ['nwr["amenity"~"restaurant|fast_food|cafe|food_court|ice_cream"]'],
  Sports: ['nwr["sport"~"tennis|golf|fitness|yoga"]'],
  Outdoors: [
    'nwr["leisure"~"park|garden|nature_reserve"]',
    'nwr["leisure"~"park|nature_reserve|recreation_ground|dog_park"]',
    'nwr["tourism"~"viewpoint|picnic_site|camp_site"]',
    'nwr["leisure"="pitch"]',
  ],
  Education: [
    'nwr["tourism"~"museum|art_gallery"]',
    'nwr["amenity"="library"]',
    'nwr["tourism"="museum"]["subject"="science"]',
    'nwr["historic"]',
  ],
  Shopping: [
    'nwr["shop"="mall"]',
    'nwr["shop"="clothes"]',
    'nwr["shop"="gift"]',
    'nwr["shop"="toys"]',
    'nwr["shop"="books"]',
    'nwr["shop"="electronics"]',
  ],
  Entertainment: [
    'nwr["amenity"="cinema"]',
    'nwr["leisure"="amusement_arcade"]',
    'nwr["tourism"="theme_park"]',
    'nwr["leisure"="playground"]',
    'nwr["leisure"="bowling_alley"]',
    'nwr["leisure"="miniature_golf"]',
  ],
};

const OVERPASS_QUERY_DEBUG_PREFIX = "[OverpassQuery]";
const DEFAULT_OVERPASS_RESULT_LIMIT = 12;

function logOverpassQueryDebug(message: string, details?: unknown) {
  console.log(OVERPASS_QUERY_DEBUG_PREFIX, message, details ?? "");
}

const createQuery = (
  categories: DateCategory[],
  userLocation: { lat: number; lon: number },
  distanceMeters: number,
  resultLimit: number = DEFAULT_OVERPASS_RESULT_LIMIT,
) => {
  const nodesString = categories
    .map((cat) => {
      const nodes = dateCategoryToNodes[cat] || [];

      return nodes.map((node) => `${node}(around:${distanceMeters},${userLocation.lat},${userLocation.lon});`).join("\n");
    })
    .join("\n");

  const query = `
[out:json];(
${nodesString}
  );out center ${Math.max(1, Math.floor(resultLimit))};`;

  logOverpassQueryDebug("built query", {
    categories,
    userLocation,
    distanceMeters,
    resultLimit: Math.max(1, Math.floor(resultLimit)),
    queryLength: query.length,
    queryPreview: query.slice(0, 500),
  });

  return query;
};

export default createQuery;
