import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for pickup and delivery
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LogisticsMap() {
  const center: [number, number] = [25.2048, 55.2708]; // Dubai

  const tasks = [
    {
      id: 'SHP-9021',
      driver: 'Mohammed K.',
      pickup: [25.1972, 55.2744] as [number, number], // Burj Khalifa area
      delivery: [25.0657, 55.1403] as [number, number], // Dubai Marina
      status: 'In Transit'
    },
    {
      id: 'SHP-9025',
      driver: 'Saeed A.',
      pickup: [25.2697, 55.3094] as [number, number], // Deira
      delivery: [25.1181, 55.2006] as [number, number], // Al Barsha
      status: 'Picking Up'
    }
  ];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {tasks.map((task) => (
          <React.Fragment key={task.id}>
            {/* Pickup Marker */}
            <Marker position={task.pickup} icon={pickupIcon}>
              <Popup>
                <div className="text-xs">
                  <strong className="block text-blue-600 mb-1">Pickup: {task.id}</strong>
                  Driver: {task.driver}<br/>
                  Status: {task.status}
                </div>
              </Popup>
            </Marker>
            
            {/* Delivery Marker */}
            <Marker position={task.delivery} icon={deliveryIcon}>
              <Popup>
                <div className="text-xs">
                  <strong className="block text-green-600 mb-1">Delivery: {task.id}</strong>
                  Driver: {task.driver}<br/>
                  Status: {task.status}
                </div>
              </Popup>
            </Marker>

            {/* Route Line */}
            <Polyline 
              positions={[task.pickup, task.delivery]} 
              color={task.status === 'In Transit' ? '#3b82f6' : '#94a3b8'} 
              weight={3}
              dashArray="5, 10"
              opacity={0.6}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
