export interface Coordinate {
  id: string;
  lat: number;
  lng: number;
  isCenter?: boolean;
  isWifiLocation?: boolean;
  name?: string;
  type?: 'original' | 'wifi' | 'center';
  gridIndex?: number;
  address?: string;
}

export interface RouteOptimizationParams {
  wifiInterval: number;
  maxWifiSearchRadius: number;
  enableWifiStops: boolean;
}

export interface OptimizedRoute {
  points: Coordinate[];
  totalDistance: number;
  totalTime: number;
  wifiStops: number;
}

export interface DistanceMatrix {
  [fromId: string]: {
    [toId: string]: {
      distance: number;
      duration: number;
    };
  };
}

export interface PlacesApiResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    name: string;
    place_id: string;
    types: string[];
  }>;
}