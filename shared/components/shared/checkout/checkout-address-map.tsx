'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';

const customIcon = L.divIcon({
  html: `
    <div style="
      background-color: white;
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 2px solid #f97316;
    ">
      <span style="font-size: 20px; line-height: 1;">🍕</span>
    </div>
    <div style="
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 10px solid #f97316;
      margin: 0 auto;
      margin-top: -2px;
    "></div>
  `,
  className: 'custom-pizza-marker',
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

interface Props {
  onChange: (value: string) => void;
  onPositionChange?: (pos: [number, number] | null) => void;
  position?: [number, number] | null;
  className?: string;
  readOnly?: boolean;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (err) {
    console.error('Reverse Geocoding Error', err);
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function LocationMarker({
  onChange,
  position,
  setPosition,
  readOnly,
}: {
  onChange: (addr: string) => void;
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click: async (e) => {
      if (readOnly) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPosition([lat, lng]);
      const addr = await reverseGeocode(lat, lng);
      onChange(addr);
    },
  });

  return position === null ? null : <Marker position={position} icon={customIcon}></Marker>;
}

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);
  return null;
}

export const CheckoutAddressMap: React.FC<Props> = ({ onChange, onPositionChange, position: propsPosition, className, readOnly }) => {
  const [internalPosition, setInternalPosition] = React.useState<[number, number] | null>(null);
  const [locating, setLocating] = React.useState(false);

  const position = propsPosition !== undefined ? propsPosition : internalPosition;
  const setPosition = (pos: [number, number] | null) => {
    if (onPositionChange) {
      onPositionChange(pos);
    } else {
      setInternalPosition(pos);
    }
  };

  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        const addr = await reverseGeocode(lat, lng);
        onChange(addr);
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error', err);
        alert('Не удалось определить местоположение. Разрешите доступ к геолокации.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="flex items-center gap-2 self-start px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          <LocateFixed size={18} className={locating ? 'animate-spin' : ''} />
          {locating ? 'Определяем...' : 'Определить моё местоположение'}
        </button>
      )}

      <div className={className} style={{ height: 350, width: '100%', borderRadius: 16, overflow: 'hidden', position: 'relative', zIndex: 1, border: '1px solid #e5e7eb' }}>
        <MapContainer
          center={position || [38.5598, 68.7741]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onChange={onChange} position={position} setPosition={setPosition} readOnly={readOnly} />
          <FlyToLocation position={position} />
        </MapContainer>
      </div>
    </div>
  );
};
