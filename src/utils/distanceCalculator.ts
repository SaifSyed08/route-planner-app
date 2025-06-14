import { Coordinate, DistanceMatrix } from '../types';

interface OSRMResponse {
  durations: number[][];
  distances: number[][];
  code: string;
}

interface OSRMRouteResponse {
  routes: Array<{
    geometry: string;
    distance: number;
    duration: number;
    legs: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
  code: string;
}

export const calculateDistanceMatrix = async (
  coordinates: Coordinate[]
): Promise<DistanceMatrix> => {
  if (coordinates.length === 0) {
    return {};
  }

  try {
    // Prepare coordinates for OSRM API (longitude, latitude format)
    const coordsString = coordinates
      .map(coord => `${coord.lng},${coord.lat}`)
      .join(';');

    // Use OSRM public API for distance matrix
    const url = `https://router.project-osrm.org/table/v1/driving/${coordsString}?annotations=distance,duration`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const data: OSRMResponse = await response.json();
    
    if (data.code !== 'Ok' || !data.distances || !data.durations) {
      throw new Error(`OSRM API error: ${data.code}`);
    }

    // Convert to our distance matrix format
    const matrix: DistanceMatrix = {};
    
    coordinates.forEach((fromCoord, fromIndex) => {
      matrix[fromCoord.id] = {};
      
      coordinates.forEach((toCoord, toIndex) => {
        const distance = data.distances[fromIndex][toIndex];
        const duration = data.durations[fromIndex][toIndex];
        
        matrix[fromCoord.id][toCoord.id] = {
          distance: distance || 0, // meters
          duration: duration || 0  // seconds
        };
      });
    });

    console.log('Successfully calculated distance matrix using OSRM');
    return matrix;

  } catch (error) {
    console.error('Error calculating distance matrix with OSRM:', error);
    
    // Fallback to Haversine distance calculation
    console.log('Falling back to Haversine distance calculation');
    return calculateHaversineMatrix(coordinates);
  }
};

// Get actual route geometry between two points
export const getRouteGeometry = async (
  from: Coordinate,
  to: Coordinate
): Promise<[number, number][]> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM Route API error: ${response.statusText}`);
    }

    const data: OSRMRouteResponse = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM Route API error: ${data.code}`);
    }

    // Extract coordinates from the route geometry
    const route = data.routes[0];
    if (route.geometry && typeof route.geometry === 'object' && 'coordinates' in route.geometry) {
      // GeoJSON format: coordinates are [lng, lat], we need [lat, lng] for Leaflet
      return (route.geometry as any).coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    }

    // Fallback to direct line
    return [[from.lat, from.lng], [to.lat, to.lng]];

  } catch (error) {
    console.error('Error getting route geometry:', error);
    // Fallback to direct line
    return [[from.lat, from.lng], [to.lat, to.lng]];
  }
};

// Get complete route geometry for entire route
export const getCompleteRouteGeometry = async (
  routePoints: Coordinate[]
): Promise<[number, number][]> => {
  if (routePoints.length < 2) {
    return routePoints.map(p => [p.lat, p.lng]);
  }

  try {
    // Create waypoints string for OSRM
    const coordsString = routePoints
      .map(coord => `${coord.lng},${coord.lat}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?geometries=geojson&overview=full`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM Route API error: ${response.statusText}`);
    }

    const data: OSRMRouteResponse = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM Route API error: ${data.code}`);
    }

    const route = data.routes[0];
    if (route.geometry && typeof route.geometry === 'object' && 'coordinates' in route.geometry) {
      // GeoJSON format: coordinates are [lng, lat], we need [lat, lng] for Leaflet
      return (route.geometry as any).coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    }

    // Fallback to connecting points directly
    return routePoints.map(p => [p.lat, p.lng]);

  } catch (error) {
    console.error('Error getting complete route geometry:', error);
    // Fallback to connecting points directly
    return routePoints.map(p => [p.lat, p.lng]);
  }
};

// Fallback: Calculate distances using Haversine formula
const calculateHaversineMatrix = (coordinates: Coordinate[]): DistanceMatrix => {
  const matrix: DistanceMatrix = {};
  
  coordinates.forEach(fromCoord => {
    matrix[fromCoord.id] = {};
    
    coordinates.forEach(toCoord => {
      const distance = haversineDistance(
        fromCoord.lat, fromCoord.lng,
        toCoord.lat, toCoord.lng
      );
      
      // Estimate duration (assuming average speed of 40 km/h in urban areas)
      const duration = (distance / 1000) * (3600 / 40);
      
      matrix[fromCoord.id][toCoord.id] = {
        distance,
        duration
      };
    });
  });
  
  return matrix;
};

// Haversine formula for calculating distance between two points
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => degrees * (Math.PI / 180);