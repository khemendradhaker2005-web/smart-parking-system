import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, ArrowRight } from 'lucide-react';

// Custom sharp HTML DivIcon for parking markers
function createParkingIcon(availableSlots) {
  const isAvailable = availableSlots > 0;
  const bgColor = isAvailable ? '#2563eb' : '#94a3b8';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        border-radius: 9999px;
        padding: 4px 8px;
        font-family: monospace;
        font-weight: 700;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 4px;
        transform: translate(-50%, -50%);
        white-space: nowrap;
      ">
        <span>🅿️</span>
        <span>${availableSlots} Left</span>
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });
}

// User location marker icon
const userIcon = L.divIcon({
  className: 'user-map-marker',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
      animation: pulse 2s infinite;
      transform: translate(-50%, -50%);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to dynamically adjust map center
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12);
    }
  }, [center, zoom, map]);
  return null;
}

export default function ParkingMap({
  locations = [],
  selectedLocation = null,
  onSelectLocation = () => {},
  userCoords = null,
  height = '420px',
}) {
  // Default center: Bangalore Center [12.9716, 77.5946]
  const defaultCenter = [12.9716, 77.5946];
  const center = selectedLocation
    ? [parseFloat(selectedLocation.latitude), parseFloat(selectedLocation.longitude)]
    : userCoords
    ? [userCoords.lat, userCoords.lng]
    : defaultCenter;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewUpdater center={center} zoom={selectedLocation ? 14 : 12} />

        {/* User Location Marker if available */}
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-bold text-slate-900">Your Current Location</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Parking Location Markers */}
        {locations.map((loc) => {
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={loc.id}
              position={[lat, lng]}
              icon={createParkingIcon(loc.available_slots)}
              eventHandlers={{
                click: () => onSelectLocation(loc),
              }}
            >
              <Popup>
                <div className="p-1 font-sans min-w-[200px]">
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{loc.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{loc.address}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-600">₹{loc.price_per_hour}/hr</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      {loc.available_slots} / {loc.total_slots} Slots
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectLocation(loc)}
                    className="mt-3 w-full py-1.5 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs flex items-center justify-center gap-1 transition"
                  >
                    <span>View & Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
