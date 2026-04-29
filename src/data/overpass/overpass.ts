import type { DateCategory } from "../../utils/utils";

const dateCategoryToNodes: Record<DateCategory, string[]> = {
  Food: ['nwr["amenity"~"restaurant|fast_food|cafe|food_court|ice_cream"]'],
  Sports: ['nwr["sport"~"tennis|golf|fitness|yoga"]'],
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
