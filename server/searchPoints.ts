import * as searchPointsData from "./searchPointsData.ts";

export interface SearchPoint {
  name: string;
  latitude: number;
  longitude: number;
  searches: PlaceTypeSearchInfo[];
}

export interface PlaceTypeSearchInfo {
  placeType: string;
  searchRadius: number;
}

const oneMileInMeters = 1609.34;
const twoMilesInMeters = oneMileInMeters * 2;
const threeMilesInMeters = oneMileInMeters * 3;
const fourMilesInMeters = oneMileInMeters * 4;
const fiveMilesInMeters = oneMileInMeters * 5;
const tenMilesInMeters = oneMileInMeters * 10;
const fifteenMilesInMeters = oneMileInMeters * 15;

const points: SearchPoint[] = [
  {
    name: "Provo",
    latitude: 40.23378,
    longitude: -111.66751,
    searches: searchPointsData.provoSearches,
  },
  {
    name: "Lehi",
    latitude: 40.39168,
    longitude: -111.85122,
    searches: searchPointsData.lehiSearches,
  },
  {
    name: "Salt Lake City",
    latitude: 40.7608,
    longitude: -111.891,
    searches: searchPointsData.slcSearches,
  },
  {
    name: "Lindon",
    latitude: 40.35423,
    longitude: -111.72028,
    searches: searchPointsData.lindonSearches,
  },
  {
    name: "Hayes Park (Near Cedar Hills)",
    latitude: 40.426,
    longitude: -111.76328,
    searches: searchPointsData.hayesParkSearches,
  },
];

export default points;
