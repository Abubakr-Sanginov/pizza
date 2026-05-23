'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, LocateFixed, Clock, Footprints } from 'lucide-react';

// Custom pizza marker for the store
const storeIcon = L.divIcon({
  html: `
    <div style="
      background-color: white; 
      border-radius: 12px; 
      padding: 6px; 
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.25); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      width: 42px; 
      height: 42px;
      border: 2.5px solid #f97316;
    ">
      <span style="font-size: 22px; line-height: 1;">🍕</span>
    </div>
    <div style="
      width: 0; height: 0; 
      border-left: 8px solid transparent; 
      border-right: 8px solid transparent; 
      border-top: 10px solid #f97316; 
      margin: 0 auto; margin-top: -2px;
    "></div>
  `,
  className: 'custom-pizza-marker',
  iconSize: [42, 52],
  iconAnchor: [21, 52],
});

// Custom user location marker
const userIcon = L.divIcon({
  html: `
    <div style="
      background-color: #3b82f6; 
      border-radius: 50%; 
      width: 16px; 
      height: 16px;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.4), 0 4px 6px -1px rgb(0 0 0 / 0.2);
    "></div>
  `,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
}

function RoutingLayer({
  storePos,
  userPos,
  onRouteFound,
}: {
  storePos: [number, number];
  userPos: [number, number] | null;
  onRouteFound: (info: RouteInfo) => void;
}) {
  const map = useMap();
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!userPos) return;

    // Remove previous route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Fetch route from OSRM (free, no API key needed)
    const url = `https://router.project-osrm.org/route/v1/walking/${userPos[1]},${userPos[0]};${storePos[1]},${storePos[0]}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.routes || data.routes.length === 0) return;

        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        // Draw route line
        const polyline = L.polyline(coords, {
          color: '#f97316',
          weight: 5,
          opacity: 0.85,
          dashArray: '0',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routeLayerRef.current = polyline;

        // Fit map to show full route
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

        onRouteFound({
          distance: route.distance,
          duration: route.duration,
        });
      })
      .catch((err) => console.error('Route error:', err));

    return () => {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }
    };
  }, [userPos, storePos, map, onRouteFound]);

  return null;
}

function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 15);
  }, [position, map]);
  return null;
}

interface Props {
  storePosition: [number, number];
  storeAddress: string;
}

export const CheckoutPickupMap: React.FC<Props> = ({ storePosition, storeAddress }) => {
  const [userPos, setUserPos] = React.useState<[number, number] | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [routeInfo, setRouteInfo] = React.useState<RouteInfo | null>(null);
  const [flyTo, setFlyTo] = React.useState<[number, number] | null>(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается браузером');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setFlyTo(coords);
        setLocating(false);
        setRouteInfo(null);
      },
      () => {
        alert('Не удалось определить местоположение. Разрешите доступ к геолокации.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} м`;
    return `${(meters / 1000).toFixed(1)} км`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} мин`;
    return `${Math.floor(mins / 60)} ч ${mins % 60} мин`;
  };

  const handleRouteFound = React.useCallback((info: RouteInfo) => {
    setRouteInfo(info);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Address info */}
      <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
        <span className="text-lg leading-none mt-0.5">🍕</span>
        <div>
          <div className="font-medium text-foreground">Адрес заведения</div>
          <div className="text-muted-foreground mt-0.5">{storeAddress}</div>
        </div>
      </div>

      {/* Route info */}
      {routeInfo && (
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm">
            <Footprints size={16} className="text-orange-500 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Расстояние</div>
              <div className="font-semibold text-foreground">{formatDistance(routeInfo.distance)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
            <Clock size={16} className="text-blue-500 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Пешком</div>
              <div className="font-semibold text-foreground">{formatDuration(routeInfo.duration)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ height: 340, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative', zIndex: 1 }}>
        <MapContainer
          key={`${storePosition[0]}-${storePosition[1]}`}
          center={storePosition}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={storePosition} icon={storeIcon} />
          {userPos && <Marker position={userPos} icon={userIcon} />}
          <RoutingLayer
            storePos={storePosition}
            userPos={userPos}
            onRouteFound={handleRouteFound}
          />
          {flyTo && <FlyTo position={flyTo} />}
        </MapContainer>
      </div>

      {/* Locate button */}
      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
      >
        {locating ? (
          <>
            <LocateFixed size={18} className="animate-spin" />
            Определяем местоположение...
          </>
        ) : (
          <>
            <Navigation size={18} />
            {userPos ? 'Обновить маршрут' : 'Проложить маршрут'}
          </>
        )}
      </button>
    </div>
  );
};
