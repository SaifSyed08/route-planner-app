import React from 'react';
import { Wifi, MapPin, Settings, WifiOff } from 'lucide-react';
import { RouteOptimizationParams } from '../types';

interface ParameterConfigProps {
  params: RouteOptimizationParams;
  onChange: (params: RouteOptimizationParams) => void;
}

export default function ParameterConfig({ 
  params, 
  onChange
}: ParameterConfigProps) {
  const handleWifiIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 10) {
      onChange({ ...params, wifiInterval: value });
    }
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1000 && value <= 20000) {
      onChange({ ...params, maxWifiSearchRadius: value });
    }
  };

  const handleWifiToggle = () => {
    onChange({ ...params, enableWifiStops: !params.enableWifiStops });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Route Parameters</h3>
        </div>

        <div className="space-y-6">
          {/* WiFi Enable/Disable Toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                {params.enableWifiStops ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span>Include WiFi Stops</span>
              </label>
              <button
                onClick={handleWifiToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  params.enableWifiStops ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    params.enableWifiStops ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              {params.enableWifiStops 
                ? 'WiFi stops will be included in route optimization for data upload/connectivity'
                : 'Route will only visit grid points without WiFi stops'
              }
            </p>
          </div>

          {/* WiFi Interval - Only show when WiFi is enabled */}
          {params.enableWifiStops && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Wifi className="w-4 h-4" />
                <span>WiFi Interval</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={params.wifiInterval}
                onChange={handleWifiIntervalChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span>
                <span className="font-medium">
                  {params.wifiInterval} point{params.wifiInterval !== 1 ? 's' : ''}
                </span>
                <span>10</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Number of original points to visit before requiring a WiFi stop
              </p>
            </div>
          )}

          {/* Search Radius - Only show when WiFi is enabled */}
          {params.enableWifiStops && (
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4" />
                <span>WiFi Search Radius</span>
              </label>
              <input
                type="range"
                min="1000"
                max="20000"
                step="1000"
                value={params.maxWifiSearchRadius}
                onChange={handleRadiusChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1km</span>
                <span className="font-medium">
                  {params.maxWifiSearchRadius / 1000}km
                </span>
                <span>20km</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Maximum distance to search for WiFi locations from route center
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Route Summary */}
      <div className={`rounded-lg border p-6 ${
        params.enableWifiStops 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' 
          : 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
      }`}>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Route Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">WiFi stops:</span>
            <span className="font-medium text-slate-900">
              {params.enableWifiStops ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          {params.enableWifiStops && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">WiFi stops required every:</span>
                <span className="font-medium text-slate-900">{params.wifiInterval} points</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">WiFi search radius:</span>
                <span className="font-medium text-slate-900">{params.maxWifiSearchRadius / 1000}km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Data source:</span>
                <span className="font-medium text-slate-900">Google Places API</span>
              </div>
            </>
          )}
          {!params.enableWifiStops && (
            <div className="flex justify-between">
              <span className="text-slate-600">Route type:</span>
              <span className="font-medium text-slate-900">Grid points only</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}