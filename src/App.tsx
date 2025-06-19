import React, { useState, useCallback } from 'react';
import { MapPin, Settings, Upload, Route, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ParameterConfig from './components/ParameterConfig';
import MapVisualization from './components/MapVisualization';
import RouteResults from './components/RouteResults';
import { Coordinate, OptimizedRoute, RouteOptimizationParams } from './types';
import { parseCSVFile, validateCoordinates } from './utils/csvParser';
import { calculateDistanceMatrix } from './utils/distanceCalculator';
import { findNearbyWifiLocations, getMockWifiLocations } from './utils/placesApi';
import { optimizeRoute } from './utils/routeOptimizer';

type AppState = 'upload' | 'configure' | 'processing' | 'results';

interface AppData {
  coordinates: Coordinate[];
  wifiLocations: Coordinate[];
  customWifiLocations: Coordinate[];
  optimizedRoute: OptimizedRoute | null;
  params: RouteOptimizationParams;
}

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [data, setData] = useState<AppData>({
    coordinates: [],
    wifiLocations: [],
    customWifiLocations: [],
    optimizedRoute: null,
    params: {
      wifiInterval: 5,
      maxWifiSearchRadius: 5000,
      enableWifiStops: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number|undefined>(undefined)
const [focusEnableOrder, setFocusEnableOrder] = useState(false)

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const result = await parseCSVFile(file);
      
      if (!result.success) {
        setError(result.error || 'Failed to parse CSV file');
        return;
      }

      const validation = validateCoordinates(result.coordinates);
      if (!validation.valid) {
        setError(validation.error || 'Invalid coordinates');
        return;
      }

      setData(prev => ({
        ...prev,
        coordinates: result.coordinates
      }));
      
      setState('configure');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleParameterChange = useCallback((params: RouteOptimizationParams) => {
    setData(prev => ({
      ...prev,
      params
    }));
  }, []);

  const handleCustomWifiChange = useCallback((customWifiLocations: Coordinate[]) => {
    setData(prev => ({
      ...prev,
      customWifiLocations
    }));
  }, []);

  const handleOptimizeRoute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setState('processing');

    try {
      let wifiLocations: Coordinate[] = [];
      
      // Only find WiFi locations if WiFi stops are enabled
      if (data.params.enableWifiStops) {
        // Combine custom WiFi locations with discovered ones
        wifiLocations = [...data.customWifiLocations];
        
        try {
          console.log('Searching for real WiFi locations using Google Places API...');
          const discoveredWifi = await findNearbyWifiLocations(
            data.coordinates,
            data.params.maxWifiSearchRadius
          );
          
          // Filter out any discovered locations that are too close to custom ones
          const filteredDiscovered = discoveredWifi.filter(discovered => {
            return !data.customWifiLocations.some(custom => {
              const distance = Math.sqrt(
                Math.pow(discovered.lat - custom.lat, 2) + 
                Math.pow(discovered.lng - custom.lng, 2)
              );
              return distance < 0.001; // ~100m threshold
            });
          });
          
          wifiLocations = [...wifiLocations, ...filteredDiscovered];
          console.log(`Found ${discoveredWifi.length} discovered + ${data.customWifiLocations.length} custom WiFi locations`);
        } catch (err) {
          console.warn('Failed to fetch discovered WiFi locations, using custom + mock data:', err);
          const mockWifi = getMockWifiLocations(data.coordinates);
          wifiLocations = [...wifiLocations, ...mockWifi];
        }
      } else {
        console.log('WiFi stops disabled, optimizing grid points only');
      }

      // Calculate real road-based distance matrix
      console.log('Calculating distance matrix using real road data...');
      const allPoints = [...data.coordinates, ...wifiLocations];
      const distanceMatrix = await calculateDistanceMatrix(allPoints);

      // Optimize route with or without WiFi constraints
      console.log('Optimizing route...');
      const optimizedRoute = await optimizeRoute(
        data.coordinates,
        wifiLocations,
        distanceMatrix,
        {
          wifiInterval: data.params.wifiInterval,
          startFromCenter: true,
          enableWifiStops: data.params.enableWifiStops
        }
      );

      console.log('Route optimization complete:', {
        totalDistance: optimizedRoute.totalDistance,
        totalTime: optimizedRoute.totalTime,
        wifiStops: optimizedRoute.wifiStops,
        totalStops: optimizedRoute.points.length,
        wifiEnabled: data.params.enableWifiStops
      });

      setData(prev => ({
        ...prev,
        wifiLocations,
        optimizedRoute
      }));

      setState('results');
    } catch (err) {
      console.error('Route optimization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize route');
      setState('configure');
    } finally {
      setLoading(false);
    }
  }, [data.coordinates, data.params, data.customWifiLocations]);

  const resetApp = useCallback(() => {
    setState('upload');
    setFocusIndex(undefined)
setFocusEnableOrder(false)
    setData({
      coordinates: [],
      wifiLocations: [],
      customWifiLocations: [],
      optimizedRoute: null,
      params: {
        wifiInterval: 5,
        maxWifiSearchRadius: 5000,
        enableWifiStops: true
      }
    });
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Route className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">AOI Route Planner</h1>
                <p className="text-sm text-slate-600">NASA SEES</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              {['upload', 'configure', 'processing', 'results'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    state === step ? 'bg-blue-500 text-white' : 
                    ['upload', 'configure', 'processing', 'results'].indexOf(state) > index ? 'bg-green-500 text-white' : 
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {step === 'upload' && <Upload className="w-4 h-4" />}
                    {step === 'configure' && <Settings className="w-4 h-4" />}
                    {step === 'processing' && <Route className="w-4 h-4" />}
                    {step === 'results' && <CheckCircle className="w-4 h-4" />}
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 ${
                      ['upload', 'configure', 'processing', 'results'].indexOf(state) > index ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Upload Your Sampling Grid</h2>
              <p className="text-lg text-slate-600 mb-2">
                Upload a CSV file containing 37 coordinates (6×6 grid + 1 center point)
              </p>
              <p className="text-sm text-slate-500">
  Don't have a sampling grid?{" "}
  <a
    href="https://nesec.strategies.org/SEES2022_CreateSamplingGrid.html"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 hover:underline"
  >
    Get one here!
  </a>
</p>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} loading={loading} />
            
            {/* Sample Format */}
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Expected CSV Format</h3>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700">
                <div>latitude,longitude</div>
                <div>40.7128,-74.0060</div>
                <div>40.7614,-73.9776</div>
                <div>40.7505,-73.9934</div>
                <div>...</div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                The first coordinate will be treated as the center point with WiFi access.
              </p>
            </div>
          </div>
        )}

        {state === 'configure' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Configure Parameters</h2>
              <ParameterConfig
                params={data.params}
                onChange={handleParameterChange}
                customWifiLocations={data.customWifiLocations}
                onCustomWifiChange={handleCustomWifiChange}
              />
              
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={resetApp}
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  Upload New File
                </button>
                <button
                  onClick={handleOptimizeRoute}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium flex items-center justify-center space-x-2"
                >
                  <Route className="w-5 h-5" />
                  <span>Optimize Route</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Route Preview</h3>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-700">Loaded Coordinates</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                    {data.coordinates.length} points
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-slate-700">Center Point: 1</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-700">Grid Points: {data.coordinates.length - 1}</span>
                  </div>
                  {data.params.enableWifiStops ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-4 h-4 text-purple-600" />
                        <span className="text-slate-700">WiFi Interval: {data.params.wifiInterval}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-700">Search Radius: {data.params.maxWifiSearchRadius/1000}km</span>
                      </div>
                      {data.customWifiLocations.length > 0 && (
                        <div className="flex items-center space-x-2 col-span-2">
                          <Wifi className="w-4 h-4 text-purple-600" />
                          <span className="text-slate-700">Custom WiFi: {data.customWifiLocations.length} locations</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 col-span-2">
                      <Settings className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">WiFi stops disabled - grid points only</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Optimizing Your Route</h2>
            <div className="space-y-2 text-slate-600">
              {data.params.enableWifiStops ? (
                <>
                  <p className="text-lg">Finding WiFi locations using Google Places API...</p>
                  <p className="text-sm">Including {data.customWifiLocations.length} custom WiFi locations...</p>
                  <p className="text-sm">Calculating road-based distances with OSRM...</p>
                  <p className="text-sm">Solving constrained routing optimization...</p>
                </>
              ) : (
                <>
                  <p className="text-lg">Optimizing grid-only route...</p>
                  <p className="text-sm">Calculating road-based distances with OSRM...</p>
                  <p className="text-sm">Finding optimal path through all grid points...</p>
                </>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-4">
              This may take a few moments depending on the number of coordinates and API response times.
            </p>
          </div>
        )}

        {state === 'results' && data.optimizedRoute && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Optimized Route Results</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {data.params.enableWifiStops 
                    ? 'Real-world routing with WiFi locations from Google Places API'
                    : 'Grid-only route optimization without WiFi stops'
                  }
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setState('configure')}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                >
                  Reconfigure
                </button>
                <button
                  onClick={resetApp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  New Route
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <MapVisualization
                  originalPoints={data.coordinates}
                  wifiLocations={data.wifiLocations}
                  optimizedRoute={data.optimizedRoute}
                  focusEnableOrder={focusEnableOrder}
focusIndex={focusIndex}onTogglePoint={id => {
    const exists = data.optimizedRoute!.points.some(p=>p.id===id);
    const newPts = exists
      ? data.optimizedRoute!.points.filter(p=>p.id!==id)
      : [...data.optimizedRoute!.points, 
         [...data.coordinates, ...data.wifiLocations].find(p=>p.id===id)!];
    setData(prev => ({
      ...prev,
      optimizedRoute: { ...prev.optimizedRoute!, points: newPts }
    }));
  }}
/>
              </div>
              
              <div>
                <RouteResults
                  route={data.optimizedRoute}
                  params={data.params}
                  onSelectStop={i => {
  setFocusEnableOrder(true)
  setFocusIndex(i)
}}
onUpdateRoute={pts => setData(prev => prev.optimizedRoute
  ? { ...prev, optimizedRoute: { ...prev.optimizedRoute, points: pts } }
  : prev
)}

                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;