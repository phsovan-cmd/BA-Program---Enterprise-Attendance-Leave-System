import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, X, Navigation, Check } from 'lucide-react';
import { getCurrentPosition, parseCoordinates } from '../utils/geo';

interface MapPickerModalProps {
  isOpen: boolean;
  initialLocation: string; // "lat,lng"
  onClose: () => void;
  onConfirm: (coords: string) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  initialLocation,
  onClose,
  onConfirm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [selectedCoords, setSelectedCoords] = useState<string>(initialLocation || '11.556400,104.928200');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const coords = parseCoordinates(initialLocation) || { lat: 11.5564, lng: 104.9282 };
    setSelectedCoords(`${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`);

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Fix Leaflet's default icon paths in bundlers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const str = `${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`;
          setSelectedCoords(str);
        });

        map.on('click', e => {
          marker.setLatLng(e.latlng);
          const str = `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`;
          setSelectedCoords(str);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([coords.lat, coords.lng]);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, initialLocation]);

  // Clean up map when modal completely unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleLocateMe = async () => {
    try {
      setGpsError(null);
      setIsLocating(true);
      const pos = await getCurrentPosition();
      const str = `${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`;
      setSelectedCoords(str);

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([pos.lat, pos.lng], 17);
        markerRef.current.setLatLng([pos.lat, pos.lng]);
      }
    } catch (err: any) {
      setGpsError(err.message || 'មិនអាចកំណត់ទីតាំង GPS បានទេ');
    } finally {
      setIsLocating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">ជ្រើសរើសទីតាំងលើផែនទី</h3>
              <p className="text-[11px] text-slate-500">ចុចលើផែនទី ឬអូសសញ្ញាសម្គាល់ ដើម្បីកំណត់កូអរដោនេ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Error Notification if any */}
        {gpsError && (
          <div className="mx-3 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <span>{gpsError}</span>
            <button onClick={() => setGpsError(null)} className="text-rose-500 font-bold ml-2">×</button>
          </div>
        )}

        {/* Map Container */}
        <div className="p-3 relative">
          <div
            ref={mapContainerRef}
            className="h-72 w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden"
          />

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="absolute bottom-6 right-6 z-[1000] px-3 py-2 bg-white/95 backdrop-blur text-slate-700 hover:text-indigo-600 rounded-xl shadow-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-4 h-4 text-indigo-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'កំពុងស្វែងរក...' : 'GPS បច្ចុប្បន្ន'}</span>
          </button>
        </div>

        {/* Footer / Selected coordinates */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 w-full sm:w-auto font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 truncate">
            <span className="text-slate-400 select-none">GPS: </span>
            <span className="font-bold text-indigo-600">{selectedCoords}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(selectedCoords);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>យល់ព្រម</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
