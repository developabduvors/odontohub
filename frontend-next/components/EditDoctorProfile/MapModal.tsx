'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (nextLat: number, nextLng: number) => void;
}) {
  useMapEvents({
    click(event: any) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return (
    // @ts-ignore
    <CircleMarker
      center={[lat, lng]}
      radius={10}
      pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9 }}
    />
  );
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string, lat: number, lng: number) => void;
  initialLat: number;
  initialLng: number;
  initialAddress: string;
}

export default function MapModal({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress,
}: MapModalProps) {
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  const [mapAddress, setMapAddress] = useState(initialAddress);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');

  if (!isOpen) return null;

  const pickLocation = async (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setMapError('');

    try {
      const reverse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await reverse.json();
      if (data?.display_name) {
        setMapAddress(data.display_name);
      }
    } catch {
      // Ignore
    }
  };

  const handleSearchAddress = async () => {
    const query = mapAddress.trim();
    if (!query) {
      setMapError('Сначала введите адрес');
      return;
    }

    setMapLoading(true);
    setMapError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setMapError('Адрес не найден. Уточните адрес и попробуйте снова.');
        return;
      }

      setCoordinates({
        lat: Number(data[0].lat),
        lng: Number(data[0].lon),
      });
      setMapAddress(data[0].display_name || query);
    } catch {
      setMapError('Не удалось найти адрес. Проверьте интернет и попробуйте снова.');
    } finally {
      setMapLoading(false);
    }
  };

  const handleConfirm = async () => {
    let finalAddress = mapAddress.trim();
    if (!finalAddress) {
      try {
        const reverse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}`
        );
        const data = await reverse.json();
        finalAddress = data?.display_name || '';
      } catch {
        finalAddress = '';
      }
    }

    if (!finalAddress) {
      setMapError('Сначала найдите адрес через кнопку "Найти".');
      return;
    }

    onConfirm(finalAddress, coordinates.lat, coordinates.lng);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Выберите адрес на карте</h2>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-[350px] bg-gray-100">
          {/* @ts-ignore */}
          <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={14} scrollWheelZoom className="h-full w-full">
            {/* @ts-ignore */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapPicker lat={coordinates.lat} lng={coordinates.lng} onPick={pickLocation} />
          </MapContainer>
        </div>

        <div className="border-t p-4">
          <label className="mb-2 block text-sm text-gray-600">Адрес</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={mapAddress}
              onChange={(e) => setMapAddress(e.target.value)}
              className="h-12 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 text-base font-semibold focus:border-blue-400 focus:outline-none"
              placeholder="Введите адрес"
            />
            <button
              onClick={handleSearchAddress}
              disabled={mapLoading}
              className="h-12 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {mapLoading ? 'Поиск...' : 'Найти'}
            </button>
          </div>
          {mapError ? <p className="mt-2 text-xs text-red-500">{mapError}</p> : null}
          <p className="mt-2 text-xs text-gray-500">Координаты: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>
        </div>

        <div className="flex gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-gray-100 px-6 py-2.5 font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-2xl bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
