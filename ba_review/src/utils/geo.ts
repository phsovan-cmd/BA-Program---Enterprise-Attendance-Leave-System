/**
 * Geographic calculations and GPS helpers
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export function parseCoordinates(locationStr: string): LatLng | null {
  if (!locationStr || typeof locationStr !== 'string') return null;
  const parts = locationStr.split(',').map(s => parseFloat(s.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

/**
 * Calculates distance in meters between two coordinates using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // 1 decimal place
}

/**
 * Get device GPS coordinates
 */
export function getCurrentPosition(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('ឧបករណ៍របស់អ្នកមិនគាំទ្រប្រព័ន្ធ GPS ទេ (Geolocation not supported)'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 10,
        });
      },
      error => {
        let msg = 'មិនអាចទាញយកទីតាំង GPS របស់អ្នកបានទេ។';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'សូមអនុញ្ញាតសិទ្ធិចូលប្រើប្រាស់ GPS ក្នុងកម្មវិធីរុករក (Allow Location Permission)។';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'សញ្ញា GPS មិនច្បាស់លាស់ ឬរកមិនឃើញទីតាំង។';
        } else if (error.code === error.TIMEOUT) {
          msg = 'ការស្វែងរកទីតាំង GPS យឺតពេល (Timeout)។';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      }
    );
  });
}
