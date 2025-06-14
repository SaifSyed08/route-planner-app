import { Coordinate } from '../types';

export interface NearbyWifiLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'wifi';
  placeId: string;
  types: string[];
  address?: string;
  rating?: number;
}

const WIFI_PLACE_TYPES = [
  'cafe',
  'library',
  'university',
  'hotel',
  'book_store',
  'restaurant',
  'shopping_mall',
];

const TRUSTED_WIFI_NAMES = [
  'starbucks',
  'mcdonalds',
  'panera',
  'dunkin',
  'chickfila',
  'walmart',
  'coffee',
  'cafe',
  'boba',
  'mall',
  'library',
  'hotel'
];

export const findNearbyWifiLocations = async (
  coordinates: Coordinate[],
  radius: number = 5000
): Promise<NearbyWifiLocation[]> => {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Places API key not found in environment variables, using mock data');
    return getMockWifiLocations(coordinates);
  }

  const lats = coordinates.map(c => c.lat);
  const lngs = coordinates.map(c => c.lng);
  const bounds = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };

  const centerLat = (bounds.north + bounds.south) / 2;
  const centerLng = (bounds.east + bounds.west) / 2;

  const wifiLocations: NearbyWifiLocation[] = [];
  const seenPlaceIds = new Set<string>();

  try {
    for (const placeType of WIFI_PLACE_TYPES) {
      const response = await fetch(`/api/wifi?lat=${centerLat}&lng=${centerLng}&type=${placeType}`);
      if (!response.ok) {
        console.warn(`Failed to fetch ${placeType} places:`, response.statusText);
        continue;
      }

      const data = await response.json();
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`Places API error for ${placeType}:`, data.status, data.error_message);
        continue;
      }

      for (const place of data.results) {
        if (seenPlaceIds.has(place.place_id)) continue;

        const normalizedName = (place.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        if (
          placeType !== 'cafe' &&
          !TRUSTED_WIFI_NAMES.some(kw => normalizedName.includes(kw))
        ) {
          continue;
        }

        const placeLat = place.geometry.location.lat;
        const placeLng = place.geometry.location.lng;
        const buffer = 0.01;

        if (
          placeLat >= bounds.south - buffer && placeLat <= bounds.north + buffer &&
          placeLng >= bounds.west - buffer && placeLng <= bounds.east + buffer
        ) {
          wifiLocations.push({
            id: `wifi_${place.place_id}`,
            lat: placeLat,
            lng: placeLng,
            name: place.name || `${placeType} location`,
            type: 'wifi',
            placeId: place.place_id,
            types: place.types || [placeType],
            address: place.vicinity || place.formatted_address,
            rating: place.rating
          });

          seenPlaceIds.add(place.place_id);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Found ${wifiLocations.length} filtered WiFi locations`);
    return wifiLocations;

  } catch (error) {
    console.error('Error fetching WiFi locations:', error);
    return Promise.resolve(getMockWifiLocations(coordinates));
  }
};

export const getMockWifiLocations = (coordinates: Coordinate[]): NearbyWifiLocation[] => {
  if (coordinates.length === 0) return [];

  const lats = coordinates.map(c => c.lat);
  const lngs = coordinates.map(c => c.lng);
  const bounds = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };

  return [
    {
      id: 'mock_wifi_0',
      lat: bounds.south + (bounds.north - bounds.south) * 0.2,
      lng: bounds.west + (bounds.east - bounds.west) * 0.3,
      name: 'Central Public Library',
      type: 'wifi',
      placeId: 'mock_place_0',
      types: ['library', 'establishment'],
      address: 'Main Street'
    },
    {
      id: 'mock_wifi_1',
      lat: bounds.south + (bounds.north - bounds.south) * 0.7,
      lng: bounds.west + (bounds.east - bounds.west) * 0.6,
      name: 'Coffee Bean Cafe',
      type: 'wifi',
      placeId: 'mock_place_1',
      types: ['cafe', 'food', 'establishment'],
      address: 'Oak Avenue'
    },
    {
      id: 'mock_wifi_2',
      lat: bounds.south + (bounds.north - bounds.south) * 0.4,
      lng: bounds.west + (bounds.east - bounds.west) * 0.8,
      name: 'McDonald\'s',
      type: 'wifi',
      placeId: 'mock_place_2',
      types: ['restaurant', 'food', 'establishment'],
      address: 'Highway 101'
    },
    {
      id: 'mock_wifi_3',
      lat: bounds.south + (bounds.north - bounds.south) * 0.8,
      lng: bounds.west + (bounds.east - bounds.west) * 0.2,
      name: 'Panera Bread',
      type: 'wifi',
      placeId: 'mock_place_3',
      types: ['restaurant', 'food', 'establishment'],
      address: 'Broadway Street'
    }
  ];
};