import { Coordinate, DistanceMatrix, OptimizedRoute } from '../types';

export interface OptimizationParams {
  wifiInterval: number;
  startFromCenter: boolean;
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

  const optimizedRoute = apply2OptImprovement(route, distanceMatrix);
  const totals = calculateRouteTotals(optimizedRoute, distanceMatrix);

  return {
    points: optimizedRoute,
    totalDistance: totals.distance,
    totalTime: totals.duration,
    wifiStops: optimizedRoute.filter(p => p.type === 'wifi').length
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

const hasConsecutiveWiFi = (route: Coordinate[]): boolean =>
  route.some((p, i) => p.type === 'wifi' && route[i + 1]?.type === 'wifi');

const apply2OptImprovement = (
  route: Coordinate[],
  distanceMatrix: DistanceMatrix
): Coordinate[] => {
  if (route.length <= 3) return route;
  let bestRoute = [...route];
  let bestDist = calculateRouteTotals(bestRoute, distanceMatrix).distance;
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        const candidate = twoOptSwap(bestRoute, i, j);
        if (hasConsecutiveWiFi(candidate)) continue;
        const d = calculateRouteTotals(candidate, distanceMatrix).distance;
        if (d < bestDist) {
          bestDist = d;
          bestRoute = candidate;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
};

const twoOptSwap = (route: Coordinate[], i: number, j: number): Coordinate[] => {
  const newRoute = [...route];
  while (i < j) {
    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
    i++;
    j--;
  }
  return newRoute;
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
