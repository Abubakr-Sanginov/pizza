"use client";

import React from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/shared/lib/utils";
import { Clock, MapPin, Phone, ShoppingCart, Timer, Truck } from "lucide-react";


const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});


const DELIVERY_ZONES = [
  {
    radius: 2000,
    color: "#22c55e",
    fillColor: "#22c55e",
    label: "Зона 1",
    time: "20–30 мин",
    price: "Бесплатно",
  },
  {
    radius: 4000,
    color: "#f59e0b",
    fillColor: "#f59e0b",
    label: "Зона 2",
    time: "30–45 мин",
    price: "15 TJS",
  },
  {
    radius: 7000,
    color: "#ef4444",
    fillColor: "#ef4444",
    label: "Зона 3",
    time: "45–60 мин",
    price: "30 TJS",
  },
];

interface Store {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface Props {
  stores: Store[];
  className?: string;
}


function MapCenter({ stores }: { stores: Store[] }) {
  const map = useMap();
  React.useEffect(() => {
    const valid = stores.filter((s) => s.lat && s.lng);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat!, valid[0].lng!], 13);
    } else {
      const bounds = L.latLngBounds(valid.map((s) => [s.lat!, s.lng!]));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [stores, map]);
  return null;
}

export const DeliveryMap: React.FC<Props> = ({ stores, className }) => {
  const [activeStore, setActiveStore] = React.useState<Store | null>(
    stores[0] ?? null,
  );


  const defaultCenter: [number, number] = [38.5598, 68.7738];

  return (
    <div className={cn("flex flex-col lg:flex-row gap-6", className)}>
      {}
      <div
        className="flex-1 rounded-3xl overflow-hidden shadow-2xl"
        style={{ minHeight: 480 }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ width: "100%", height: "100%", minHeight: 480 }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter stores={stores} />

          {}
          {activeStore?.lat &&
            activeStore?.lng &&
            DELIVERY_ZONES.map((zone, i) => (
              <Circle
                key={i}
                center={[activeStore.lat!, activeStore.lng!]}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.fillColor,
                  fillOpacity: 0.08 + i * 0.03,
                  weight: 2,
                  dashArray: i === 0 ? undefined : "6 4",
                }}
              />
            ))}

          {}
          {stores
            .filter((s) => s.lat && s.lng)
            .map((store) => (
              <Marker
                key={store.id}
                position={[store.lat!, store.lng!]}
                icon={markerIcon}
                eventHandlers={{ click: () => setActiveStore(store) }}
              >
                <Popup>
                  <div className="text-sm font-semibold">{store.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {store.address}
                  </div>
                  {store.phone && (
                    <div className="text-xs mt-1">{store.phone}</div>
                  )}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {}
      <div className="lg:w-[320px] flex flex-col gap-4">
        {}
        <div className="rounded-3xl glass p-5">
          <h3 className="font-bold text-base mb-4">Зоны доставки</h3>
          <div className="flex flex-col gap-3">
            {DELIVERY_ZONES.map((zone, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2"
                  style={{
                    backgroundColor: zone.fillColor + "33",
                    borderColor: zone.color,
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{zone.label}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: zone.color }}
                    >
                      {zone.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {zone.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="rounded-3xl glass p-5 flex-1">
          <h3 className="font-bold text-base mb-4">Наши рестораны</h3>
          <div className="flex flex-col gap-3">
            {stores.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Нет данных о ресторанах
              </p>
            )}
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setActiveStore(store)}
                className={cn(
                  "text-left p-3 rounded-2xl border-2 transition-all",
                  activeStore?.id === store.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-card hover:border-border",
                )}
              >
                <div className="flex items-start gap-2">
                  <MapPin
                    size={14}
                    className="text-primary mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold">{store.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {store.address}
                    </p>
                    {store.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone size={11} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {store.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="rounded-3xl glass p-5">
          <h3 className="font-bold text-base mb-3">Время работы</h3>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Пн – Пт</span>
              <span className="font-semibold">10:00 – 23:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Сб – Вс</span>
              <span className="font-semibold">10:00 – 00:00</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Доставка</span>
              <span className="font-semibold text-primary">Ежедневно</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
