
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L, { Icon, LatLngBounds } from 'leaflet';
import { Coordinate, OptimizedRoute } from '../types';

import { getCompleteRouteGeometry } from '../utils/distanceCalculator';
import 'leaflet/dist/leaflet.css';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapVisualizationProps {
  originalPoints: Coordinate[];
  wifiLocations: Coordinate[];
  optimizedRoute: OptimizedRoute;
  focusIndex?: number;
  focusEnableOrder?: boolean;
  onTogglePoint?: (id: string) => void;

}

export default function MapVisualization({
  originalPoints,
  wifiLocations,
  optimizedRoute,
  focusIndex,
  focusEnableOrder,
  onTogglePoint,
}: MapVisualizationProps) {
  const mapRef = useRef<any>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showRouteOrder, setShowRouteOrder] = useState(!!focusEnableOrder);

  const centerIcon = new Icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const wifiIcon = new Icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const originalIcon = new Icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const allPoints = [...originalPoints, ...wifiLocations];
  const bounds = new LatLngBounds(allPoints.map(p => [p.lat, p.lng]));

  useEffect(() => {
    if (focusEnableOrder) setShowRouteOrder(true);
  }, [focusEnableOrder]);

  useEffect(() => {
    const loadRouteGeometry = async () => {
      if (optimizedRoute.points.length < 2) return;
      setLoadingRoute(true);
      try {
        const geometry = await getCompleteRouteGeometry(optimizedRoute.points);
        setRouteGeometry(geometry);
      } catch {
        setRouteGeometry(optimizedRoute.points.map(p => [p.lat, p.lng]));
      } finally {
        setLoadingRoute(false);
      }
    };
    loadRouteGeometry();
  }, [optimizedRoute.points]);

  const didFit = useRef(false);
useEffect(() => {
  if (didFit.current || !mapRef.current) return;
  mapRef.current.fitBounds(bounds, { padding: [20, 20] });
  didFit.current = true;
}, [bounds]);
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;
  const onClose = () => {
    setShowRouteOrder(false);
  };
  map.on('popupclose', onClose);
  return () => {
    map.off('popupclose', onClose);
  };
}, []);


  useEffect(() => {
    if (focusIndex == null || !mapRef.current) return;
    const map = mapRef.current;
    const p = optimizedRoute.points[focusIndex];
    map.flyTo([p.lat, p.lng], 17);
    L.popup({ autoClose: true, closeOnClick: false })
      .setLatLng([p.lat, p.lng])
         .setContent(`
     <div class="text-sm">
       <strong>Stop #${focusIndex + 1}</strong><br/>
       ${p.name ||
         (p.isCenter || p.type === 'center'
           ? 'Center Point (Start)'
           : p.type === 'wifi'
           ? 'WiFi Stop'
           : 'Grid Point')}<br/>
       ${p.address && p.type === 'wifi' ? `📍 ${p.address}<br/>` : ''}
       <span class="text-xs text-slate-500">
         ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}
       </span>
     </div>
   `)
      .openOn(map);
  }, [focusIndex]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Route Visualization</h3>
            <p className="text-sm text-slate-600">
              Interactive map showing optimized route with real road paths
            </p>
          </div>
          {loadingRoute && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span>Loading route...</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-96 relative">
        <MapContainer
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
          zoomControl
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {originalPoints.map((point, index) => (
            <Marker
              key={`original-${point.id}`}
              position={[point.lat, point.lng]}
              icon={point.isCenter || point.type === 'center' ? centerIcon : originalIcon}
            >
             <Popup>
   <div className="text-sm">
     <strong>
       {point.isCenter || point.type === 'center'
         ? 'Center Point (Start)'
         : `Grid Point ${index + 1}`}
     </strong>
     <br/>
     Lat: {point.lat.toFixed(4)}<br/>

  Lng: {point.lng.toFixed(4)}
     {(point.isCenter || point.type === 'center') && (
       <>
         <br/>
         <span className="text-green-600">🌐 WiFi Available</span>
       </>
     )}
     <br/>
    <button
   onClick={e => { e.stopPropagation(); onTogglePoint?.(point.id); }}
   className={`mt-2 px-2 py-1 text-xs font-medium text-white rounded ${
     optimizedRoute.points.some(p => p.id === point.id)
       ? 'bg-red-600'
       : 'bg-blue-600'
   }`}
 >
   {optimizedRoute.points.some(p => p.id === point.id) ? 'Delete' : 'Add'}
 </button>









   </div>
 </Popup>
            </Marker>
          ))}

          {wifiLocations.map(point => (
            <Marker
              key={`wifi-${point.id}`}
              position={[point.lat, point.lng]}
              icon={wifiIcon}
            >
              <Popup>
  <div className="text-sm">
    <strong>📶 {point.name || 'WiFi Location'}</strong><br/>
    {point.address && <>📍 {point.address}<br/></>}
    Lat: {point.lat.toFixed(4)}<br/>
    Lng: {point.lng.toFixed(4)}<br/>
    <span className="text-purple-600">WiFi Available</span>
    {(point as any).rating && <>⭐ {(point as any).rating}/5<br/></>}
    <button
      onClick={e => { e.stopPropagation(); onTogglePoint?.(point.id); }}
      className="mt-2 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded"
    >
      {optimizedRoute.points.some(p => p.id === point.id) ? 'Delete' : 'Readd'}
    </button>
  </div>
</Popup>
            </Marker>
          ))}

          {routeGeometry.length > 1 && (
            <Polyline positions={routeGeometry} color="#3B82F6" weight={4} opacity={0.8} />
          )}

          {showRouteOrder &&
            optimizedRoute.points.map((point, index) => (
              <Marker
                key={`route-${point.id}-${index}`}
                position={[point.lat, point.lng]}
                icon={L.divIcon({
                  className: 'numbered-icon',
                  html: `
                    <div style="position: relative; top: 2px;">
                      <div style="
                        color: #2563eb;
                        background-color: white;
                        border: 2px solid #2563eb;
                        border-radius: 9999px;
                        width: 18px;
                        height: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        font-weight: bold;
                      ">
                        ${index + 1}
                      </div>
                    </div>
                  `,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Stop #{index + 1}</strong>
                    <br />
                    {point.name ||
                      (point.isCenter || point.type === 'center'
                        ? 'Center Point (Start)'
                        : point.type === 'wifi'
                        ? 'WiFi Stop'
                        : 'Grid Point')}
                    {point.address && point.type === 'wifi' && (
                      <>
                        <br />
                        📍 {point.address}
                      </>
                    )}
                    <br />
                    <span className="text-xs text-slate-500">
                      {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Center Point (Start)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Grid Points</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span>Real WiFi Locations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-blue-500 rounded"></div>
            <span>Road-Based Route</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRouteOrder(prev => !prev)}
              className="flex items-center space-x-1 px-2 py-1 border border-blue-600 text-blue-600 text-xs rounded-full hover:bg-blue-50"
            >
              <span className="font-bold">#</span>
              <span>Route Order</span>
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          Route calculated using real road distances via OSRM. WiFi locations from Google Places API.
        </div>
      </div>
    </div>
  );
}







