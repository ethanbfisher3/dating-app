import type { DateCategory } from "../../utils/utils";

const dateCategoryToNodes: Record<DateCategory, string[]> = {
  Food: ['nwr["amenity"~"restaurant|fast_food|cafe|food_court|ice_cream"]'],
  Sports: ['nwr["sport"~"tennis|golf|fitness|yoga"]'],
  Outdoors: [
    'nwr["leisure"~"park|garden|nature_reserve"]',
    'nwr["leisure"~"park|nature_reserve|recreation_ground|dog_park"]',
    'nwr["highway"~"path|footway|cycleway"]',
    'nwr["natural"~"wood|water|peak|scrub"]',
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

const createQuery = (categories: DateCategory[], userLocation: { lat: number; lon: number }, distanceMeters: number) => {
  const nodesString = categories
    .map((cat) => {
      const nodes = dateCategoryToNodes[cat] || [];

      return nodes
        .map((node) => `${node}["name"]["addr:street"](around:${distanceMeters},${userLocation.lat},${userLocation.lon});`)
        .join("\n");
    })
    .join("\n");

  const queryLimit = Number(process.env.MAX_RESULTS_PER_QUERY) || 100;

  return `
[out:json];(
${nodesString}
);out center ${queryLimit};`;
};

export default createQuery;
