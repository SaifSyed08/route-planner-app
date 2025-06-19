// RouteResults.tsx

import React, { useState, useEffect } from 'react';
import {
  Route,
  Clock,
  MapPin,
  Wifi,
  TrendingUp,
  Star,
  Navigation,
  Trash2,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { OptimizedRoute, RouteOptimizationParams } from '../types';

interface RouteResultsProps {
  route: OptimizedRoute;
  params: RouteOptimizationParams;
  onUpdateRoute?: (points: typeof route.points) => void;
  onSelectStop?: (index: number) => void;
}

export default function RouteResults({
  route: initialRoute,
  params,
  onUpdateRoute,
  onSelectStop,
}: RouteResultsProps) {
  const [routePoints, setRoutePoints] = useState(initialRoute.points);
  useEffect(() => {
  setRoutePoints(initialRoute.points);
}, [initialRoute.points]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chunkSize = 10;
  const chunks = Array.from(
    { length: Math.ceil(routePoints.length / chunkSize) },
    (_, i) => routePoints.slice(i * chunkSize, i * chunkSize + chunkSize)
  );

  const formatDistance = (d: number) =>
    d >= 1000 ? `${(d / 1000).toFixed(2)} km` : `${d.toFixed(0)} m`;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleDelete = (id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      const updated = routePoints.filter(p => p.id !== id);
      setRoutePoints(updated);
      onUpdateRoute?.(updated);
      setDeletedIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Route Summary */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Route Summary</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Route className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-600">Total Distance</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatDistance(initialRoute.totalDistance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-600">Estimated Time</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatTime(initialRoute.totalTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-600">Grid Stops</span>
              </div>
              <span className="font-semibold text-slate-900"> {routePoints.length - routePoints.filter(p => p.type === 'wifi').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-red-600" />
                <span className="text-sm text-slate-600">WiFi Stops</span>
              </div>
              <span className="font-semibold text-slate-900">
                {routePoints.filter(p => p.type === 'wifi').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Route */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Detailed Route</h3>
            <p className="text-sm text-slate-600">
              Step-by-step route with real locations and addresses
            </p>
          </div>
          <div className="relative" onMouseLeave={() => setDropdownOpen(false)}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="group flex items-center justify-end space-x-2 rounded-md px-4 py-2 min-w-[150px] hover:bg-slate-100"
            >
              <div className="flex flex-col items-end text-sm font-semibold text-blue-600 leading-tight">
                <span>Open in</span>
                <span>Google Maps</span>
              </div>
              <div className="p-1 rounded group-hover:bg-slate-100">
                {dropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-0 -mt-2 w-64 bg-white border border-blue-500 rounded-lg shadow-md z-10 overflow-visible">
                <div
                  className="flex items-center justify-between px-3 py-2 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <span className="flex items-center space-x-1 text-sm font-semibold text-slate-900">
                    <span>Open in Google Maps</span>
                    <div className="relative group">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs text-white bg-black rounded z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                        Google Maps only allows 10 stops per link
                      </div>
                    </div>
                  </span>
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                </div>
                {chunks.map((subset, idx) => {
                  const start = idx * chunkSize + 1;
                  const end = start + subset.length - 1;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const url =
                          'https://www.google.com/maps/dir/' +
                          subset.map(p => `${p.lat},${p.lng}`).join('/');
                        window.open(url, '_blank');
                        setDropdownOpen(false);
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex justify-between items-center px-3 py-2 hover:bg-slate-100 cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-blue-700">Part {idx + 1}</div>
                        <div className="text-xs text-slate-500">
                          Stops #{start}-{end}
                        </div>
                      </div>
                      {hoveredIndex === idx && (
                        <ArrowUpRight className="text-blue-700" size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Points List */}
        <div className="max-h-80 overflow-y-auto">
          <div className="p-4 space-y-3">
            {routePoints.map((point, i) => {
              const isDeleted = deletedIds.has(point.id);
              const displayName =
                point.name ||
                (point.gridIndex !== undefined
                  ? `Grid Point ${point.gridIndex + 1}`
                  : `Grid Point ${i + 1}`);

              return (
                <div
                  key={point.id}
                  onClick={() => onSelectStop?.(i)}
                  className={`relative flex items-start group space-x-3 p-3 rounded-lg bg-slate-50 transition-all duration-500 ease-in-out ${
                    isDeleted
                      ? 'opacity-0 translate-y-4 pointer-events-none'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium flex-shrink-0 ${
                      point.type === 'wifi'
                        ? 'bg-purple-100 text-purple-800'
                        : point.isCenter || point.type === 'center'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {point.type === 'wifi' && (
                        <Wifi className="w-4 h-4 text-purple-600" />
                      )}
                      {(point.isCenter || point.type === 'center') && (
                        <Navigation className="w-4 h-4 text-green-600" />
                      )}
                      {point.type === 'original' && (
                        <MapPin className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {isDeleted ? 'Deleted!' : displayName}
                      </span>
                    </div>
                    {!isDeleted && point.address && point.type === 'wifi' && (
                      <p className="text-xs text-slate-600 mb-1">
                        📍 {point.address}
                      </p>
                    )}
                    {!isDeleted && (point as any).rating && point.type === 'wifi' && (
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-slate-600">
                          {(point as any).rating}/5
                        </span>
                      </div>
                    )}
                    {!isDeleted && (
                      <p className="text-xs text-slate-500">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex-shrink-0 group-hover:hidden">
                    {point.type === 'wifi'
                      ? 'WiFi'
                      : point.isCenter || point.type === 'center'
                      ? 'Start'
                      : 'Grid'}
                  </div>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!isDeleted && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(point.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Data Sources</h4>
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>WiFi Locations:</span>
            <span className="font-medium">Google Places API (Real Data)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Route Calculation:</span>
            <span className="font-medium">OSRM (Real Road Network)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Distance Matrix:</span>
            <span className="font-medium">Real Driving Distances</span>
          </div>
        </div>
      </div>
    </div>
  );
}