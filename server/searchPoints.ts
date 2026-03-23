import * as searchPointsData from "./searchPointsData.ts"

export interface SearchPoint {
  name: string
  latitude: number
  longitude: number
  searches: PlaceTypeSearchInfo[]
}

export interface PlaceTypeSearchInfo {
  placeType: string
  searchRadius: number
}

const commonAndVeryCommonPlaces = [
  ...searchPointsData.commonPlaces,
  ...searchPointsData.veryCommonPlaces,
]

const oneMileInMeters = 1609.34
const twoMilesInMeters = oneMileInMeters * 2
const threeMilesInMeters = oneMileInMeters * 3
const fourMilesInMeters = oneMileInMeters * 4
const fiveMilesInMeters = oneMileInMeters * 5
const tenMilesInMeters = oneMileInMeters * 10
const fifteenMilesInMeters = oneMileInMeters * 15

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
  {
    name: "Orem",
    latitude: 40.2969,
    longitude: -111.6946,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "American Fork",
    latitude: 40.3769,
    longitude: -111.7958,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Pleasant Grove",
    latitude: 40.3669,
    longitude: -111.7388,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Spanish Fork",
    latitude: 40.1142,
    longitude: -111.6548,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Springville",
    latitude: 40.1736,
    longitude: -111.6112,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Utah Lake",
    latitude: 40.3169,
    longitude: -111.6068,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Saratoga Springs",
    latitude: 40.3292,
    longitude: -111.9738,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Santaquin",
    latitude: 40.1138,
    longitude: -111.8568,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Mapleton",
    latitude: 40.1758,
    longitude: -111.7698,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Eagle Mountain",
    latitude: 40.0519,
    longitude: -111.9738,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Vineyard",
    latitude: 40.3292,
    longitude: -111.9738,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Payson",
    latitude: 40.04282,
    longitude: -111.73,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Salem",
    latitude: 40.0531782492332,
    longitude: -111.67474728836116,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Alpine",
    latitude: 40.4538,
    longitude: -111.7568,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Herriman",
    latitude: 40.5219,
    longitude: -111.9738,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Riverton",
    latitude: 40.522,
    longitude: -111.934,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "West Jordan",
    latitude: 40.6097,
    longitude: -111.9391,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "South Jordan",
    latitude: 40.5622,
    longitude: -111.9291,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Draper",
    latitude: 40.5247,
    longitude: -111.8638,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Midvale",
    latitude: 40.6097,
    longitude: -111.9391,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Murray",
    latitude: 40.6667,
    longitude: -111.8878,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Sandy",
    latitude: 40.5809,
    longitude: -111.8628,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Cottonwood Heights",
    latitude: 40.5989,
    longitude: -111.8268,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Holladay",
    latitude: 40.6689,
    longitude: -111.8268,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Taylorsville",
    latitude: 40.6679,
    longitude: -111.9388,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "West Valley City",
    latitude: 40.6916,
    longitude: -111.9388,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Salt Lake County",
    latitude: 40.7608,
    longitude: -111.891,
    searches: commonAndVeryCommonPlaces,
  },
  {
    name: "Millcreek",
    latitude: 40.6667,
    longitude: -111.8878,
    searches: commonAndVeryCommonPlaces,
  },
]

export default points
