import { Coordinate, DistanceMatrix, OptimizedRoute } from '../types';

export interface OptimizationParams {
  wifiInterval: number;
  startFromCenter: boolean;
  enableWifiStops?: boolean;
}

export const optimizeRoute = async (
  originalPoints: Coordinate[],
  wifiLocations: Coordinate[],
  distanceMatrix: DistanceMatrix,
  params: OptimizationParams
): Promise<OptimizedRoute> => {
  const centerPoint = originalPoints.find(p => p.isCenter || p.type === 'center');
  if (!centerPoint) throw new Error('No center point found');

  const nonCenterPoints = originalPoints
    .filter(p => !p.isCenter && p.type !== 'center')
    .map((p, index) => ({ ...p, gridIndex: index + 1 }));

  if (!params.enableWifiStops) {
    const greedyRoute = greedyNearestNeighbor([centerPoint, ...nonCenterPoints], distanceMatrix, centerPoint);
    const totals = calculateRouteTotals(greedyRoute, distanceMatrix);

    return {
      points: greedyRoute,
      totalDistance: totals.distance,
      totalTime: totals.duration,
      wifiStops: 0
    };
  }

  // WiFi-enabled routing (still greedy)
  const route: Coordinate[] = [centerPoint];
  const unvisitedOriginal = new Set(nonCenterPoints.map(p => p.id));
  const availableWifi = new Set(wifiLocations.map(p => p.id));

  let currentPoint = centerPoint;
  let stepsSinceLastWifi = 0;

  while (unvisitedOriginal.size > 0) {
    const lastPoint = route[route.length - 1];
    let nextPoint: Coordinate | null = null;

    if (
      stepsSinceLastWifi >= params.wifiInterval &&
      availableWifi.size > 0 &&
      lastPoint.type !== 'wifi'
    ) {
      const wifiCandidates = wifiLocations.filter(
        w => availableWifi.has(w.id) && w.id !== currentPoint.id
      );
      const nearestWifi = findNearestPoint(currentPoint, wifiCandidates, distanceMatrix);
      if (nearestWifi) {
        nextPoint = nearestWifi;
        availableWifi.delete(nearestWifi.id);
        stepsSinceLastWifi = 0;
      }
    }

    if (!nextPoint) {
      const unvisitedPoints = nonCenterPoints.filter(p => unvisitedOriginal.has(p.id));
      nextPoint = findNearestPoint(currentPoint, unvisitedPoints, distanceMatrix);
      if (nextPoint) unvisitedOriginal.delete(nextPoint.id);
    }

    if (!nextPoint) break;

    route.push(nextPoint);
    if (nextPoint.type !== 'wifi') stepsSinceLastWifi++;
    currentPoint = nextPoint;
  }

  const totals = calculateRouteTotals(route, distanceMatrix);

  return {
    points: route,
    totalDistance: totals.distance,
    totalTime: totals.duration,
    wifiStops: route.filter(p => p.type === 'wifi').length
  };
};

const findNearestPoint = (
  from: Coordinate,
  candidates: Coordinate[],
  distanceMatrix: DistanceMatrix
): Coordinate | null => {
  if (candidates.length === 0) return null;
  let nearest: Coordinate | null = null;
  let minDistance = Infinity;
  for (const c of candidates) {
    const info = distanceMatrix[from.id]?.[c.id];
    if (info && info.distance < minDistance) {
      minDistance = info.distance;
      nearest = c;
    }
  }
  return nearest;
};

const calculateRouteTotals = (
  route: Coordinate[],
  distanceMatrix: DistanceMatrix
) => {
  let distance = 0;
  let duration = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];
    const info = distanceMatrix[from.id]?.[to.id];
    if (info) {
      distance += info.distance;
      duration += info.duration;
    }
  }
  return { distance, duration };
};

export const greedyNearestNeighbor = (
  points: Coordinate[],
  distanceMatrix: DistanceMatrix,
  startPoint: Coordinate
): Coordinate[] => {
  const route: Coordinate[] = [startPoint];
  const unvisited = new Set(points.filter(p => p.id !== startPoint.id).map(p => p.id));
  let current = startPoint;

  while (unvisited.size > 0) {
    const next = findNearestPoint(
      current,
      points.filter(p => unvisited.has(p.id)),
      distanceMatrix
    );
    if (!next) break;
    route.push(next);
    unvisited.delete(next.id);
    current = next;
  }

  return route;
};
