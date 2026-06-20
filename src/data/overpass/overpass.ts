import type { DateCategory } from "../../utils/utils";

// Maps each slot to the OSM (key, value) tags it needs. Slots with multiple
// tags (e.g. fitness_centre → leisure=fitness_centre OR amenity=gym) list all of them.
const slotToOsmTags: Record<string, Array<{ key: string; value: string }>> = {
  restaurant:        [{ key: "amenity", value: "restaurant" }],
  fast_food:         [{ key: "amenity", value: "fast_food" }],
  cafe:              [{ key: "amenity", value: "cafe" }],
  ice_cream:         [{ key: "amenity", value: "ice_cream" }],
  food_court:        [{ key: "amenity", value: "food_court" }],
  cinema:            [{ key: "amenity", value: "cinema" }],
  library:           [{ key: "amenity", value: "library" }],
  park:              [{ key: "leisure", value: "park" }],
  garden:            [{ key: "leisure", value: "garden" }],
  nature_reserve:    [{ key: "leisure", value: "nature_reserve" }],
  recreation_ground: [{ key: "leisure", value: "recreation_ground" }],
  dog_park:          [{ key: "leisure", value: "dog_park" }],
  fitness_centre:    [{ key: "leisure", value: "fitness_centre" }, { key: "amenity", value: "gym" }],
  gym:               [{ key: "amenity", value: "gym" }, { key: "leisure", value: "gym" }],
  swimming_pool:     [{ key: "leisure", value: "swimming_pool" }],
  ice_rink:          [{ key: "leisure", value: "ice_rink" }],
  sports_centre:     [{ key: "leisure", value: "sports_centre" }],
  bowling_alley:     [{ key: "leisure", value: "bowling_alley" }],
  miniature_golf:    [{ key: "leisure", value: "miniature_golf" }],
  amusement_arcade:  [{ key: "leisure", value: "amusement_arcade" }],
  viewpoint:         [{ key: "tourism", value: "viewpoint" }],
  picnic_site:       [{ key: "tourism", value: "picnic_site" }],
  camp_site:         [{ key: "tourism", value: "camp_site" }],
  museum:            [{ key: "tourism", value: "museum" }],
  art_gallery:       [{ key: "tourism", value: "art_gallery" }],
  theme_park:        [{ key: "tourism", value: "theme_park" }],
  tennis:            [{ key: "sport", value: "tennis" }],
  golf:              [{ key: "sport", value: "golf" }, { key: "leisure", value: "golf_course" }],
  mall:              [{ key: "shop", value: "mall" }, { key: "shop", value: "department_store" }],
  clothes:           [{ key: "shop", value: "clothes" }],
  books:             [{ key: "shop", value: "books" }],
  gift:              [{ key: "shop", value: "gift" }],
  toys:              [{ key: "shop", value: "toys" }],
  electronics:       [{ key: "shop", value: "electronics" }],
  // "historic" has no specific value — handled separately as nwr["historic"]
};

export function createQueryForSlots(
  slots: string[],
  userLocation: { lat: number; lon: number },
  distanceMeters: number,
  resultLimit?: number,
): string | null {
  const around = `(around:${distanceMeters},${userLocation.lat},${userLocation.lon})`;

  // Group values by OSM key so we emit one regex-union clause per key instead
  // of one clause per slot — reduces ~30 clauses to ~6 for a full category set.
  const keyValues = new Map<string, Set<string>>();
  let includeHistoric = false;

  for (const slot of slots) {
    if (slot === "historic") {
      includeHistoric = true;
      continue;
    }
    for (const { key, value } of slotToOsmTags[slot] ?? []) {
      const existing = keyValues.get(key) ?? new Set<string>();
      existing.add(value);
      keyValues.set(key, existing);
    }
  }

  if (!keyValues.size && !includeHistoric) return null;

  const clauses: string[] = [];

  for (const [key, values] of keyValues) {
    const valueList = [...values];
    const filter =
      valueList.length === 1
        ? `["${key}"="${valueList[0]}"]`
        : `["${key}"~"${valueList.join("|")}"]`;
    clauses.push(`  nwr${filter}${around};`);
  }

  if (includeHistoric) {
    clauses.push(`  nwr["historic"]${around};`);
  }

  const limitStr =
    typeof resultLimit === "number" && Number.isFinite(resultLimit)
      ? ` ${Math.max(1, Math.floor(resultLimit))}`
      : "";

  return `[out:json][timeout:25];(\n${clauses.join("\n")}\n);out center${limitStr};`;
}

const dateCategoryToNodes: Record<DateCategory, string[]> = {
  Food: ['nwr["amenity"~"restaurant|fast_food|cafe|food_court|ice_cream"]'],
  Sports: [
    'nwr["leisure"~"fitness_centre|sports_centre|swimming_pool|ice_rink|golf_course"]',
    'nwr["amenity"="gym"]',
    'nwr["sport"~"tennis|golf|yoga"]',
  ],
  Outdoors: [
    'nwr["leisure"~"park|garden|nature_reserve|recreation_ground|dog_park"]',
    'nwr["tourism"~"viewpoint|picnic_site|camp_site"]',
    'nwr["leisure"="pitch"]',
  ],
  Education: [
    'nwr["tourism"~"museum|art_gallery"]',
    'nwr["amenity"="library"]',
    'nwr["tourism"="museum"]["subject"="science"]',
    'nwr["historic"]',
  ],
  Shopping: ['nwr["shop"]'],
  Entertainment: [
    'nwr["amenity"="cinema"]',
    'nwr["leisure"="amusement_arcade"]',
    'nwr["tourism"="theme_park"]',
    'nwr["leisure"="playground"]',
    'nwr["leisure"="bowling_alley"]',
    'nwr["leisure"="miniature_golf"]',
  ],
};

const createQuery = (
  categories: DateCategory[],
  userLocation: { lat: number; lon: number },
  distanceMeters: number,
  resultLimit?: number,
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
  );out center${typeof resultLimit === "number" && Number.isFinite(resultLimit) ? ` ${Math.max(1, Math.floor(resultLimit))}` : ""};`;

  return query;
};

export default createQuery;
