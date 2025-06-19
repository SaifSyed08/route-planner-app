import React, { useState } from 'react';
import { Wifi, MapPin, Settings, Plus, X, Navigation, WifiOff } from 'lucide-react';
import { RouteOptimizationParams, Coordinate } from '../types';

interface ParameterConfigProps {
  params: RouteOptimizationParams;
  onChange: (params: RouteOptimizationParams) => void;
  customWifiLocations?: Coordinate[];
  onCustomWifiChange?: (locations: Coordinate[]) => void;
}

export default function ParameterConfig({ 
  params, 
  onChange, 
  customWifiLocations = [], 
  onCustomWifiChange 
}: ParameterConfigProps) {
  const [newWifiLocation, setNewWifiLocation] = useState({
    name: '',
    lat: '',
    lng: '',
    address: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddWifiLocation = () => {
    const lat = parseFloat(newWifiLocation.lat);
    const lng = parseFloat(newWifiLocation.lng);

    if (isNaN(lat) || isNaN(lng) || !newWifiLocation.name.trim()) {
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }

    const newLocation: Coordinate = {
      id: `custom_wifi_${Date.now()}`,
      lat,
      lng,
      name: newWifiLocation.name.trim(),
      type: 'wifi',
      address: newWifiLocation.address.trim() || undefined
    };

    const updatedLocations = [...customWifiLocations, newLocation];
    onCustomWifiChange?.(updatedLocations);

    // Reset form
    setNewWifiLocation({ name: '', lat: '', lng: '', address: '' });
    setShowAddForm(false);
  };

  const handleRemoveWifiLocation = (id: string) => {
    const updatedLocations = customWifiLocations.filter(loc => loc.id !== id);
    onCustomWifiChange?.(updatedLocations);
  };

  const isFormValid = () => {
    const lat = parseFloat(newWifiLocation.lat);
    const lng = parseFloat(newWifiLocation.lng);
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180 && 
           newWifiLocation.name.trim().length > 0;
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

      {/* Custom WiFi Locations - Only show when WiFi is enabled */}
      {params.enableWifiStops && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Navigation className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-900">Custom WiFi Locations</h3>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Add specific WiFi locations you know about or want to ensure are included in your route optimization.
          </p>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={newWifiLocation.name}
                    onChange={(e) => setNewWifiLocation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Starbucks Downtown"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={newWifiLocation.address}
                    onChange={(e) => setNewWifiLocation(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g., 123 Main St"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newWifiLocation.lat}
                    onChange={(e) => setNewWifiLocation(prev => ({ ...prev, lat: e.target.value }))}
                    placeholder="e.g., 40.7128"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newWifiLocation.lng}
                    onChange={(e) => setNewWifiLocation(prev => ({ ...prev, lng: e.target.value }))}
                    placeholder="e.g., -74.0060"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWifiLocation({ name: '', lat: '', lng: '', address: '' });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWifiLocation}
                  disabled={!isFormValid()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Location
                </button>
              </div>
            </div>
          )}

          {/* Custom Locations List */}
          {customWifiLocations.length > 0 ? (
            <div className="space-y-3">
              {customWifiLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Wifi className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-slate-900">{location.name}</span>
                    </div>
                    {location.address && (
                      <p className="text-sm text-slate-600 mb-1">📍 {location.address}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveWifiLocation(location.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove location"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No custom WiFi locations added yet</p>
              <p className="text-xs">Click "Add Location" to include specific WiFi spots</p>
            </div>
          )}
        </div>
      )}

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
                <span className="text-slate-600">Custom WiFi locations:</span>
                <span className="font-medium text-slate-900">{customWifiLocations.length}</span>
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