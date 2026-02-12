/**
 * Geocoding Service - MuslimGuard
 * Uses Photon API (Komoot) for city search - based on OpenStreetMap data
 * https://photon.komoot.io/
 */

const PHOTON_API = 'https://photon.komoot.io/api';

/**
 * City search result
 */
export interface CitySearchResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
  timezone: string;
}

/**
 * Raw Photon API response (GeoJSON)
 */
interface PhotonFeature {
  type: 'Feature';
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

/**
 * Get timezone from coordinates using a simple approximation
 */
function getTimezoneFromCoordinates(lat: number, lon: number): string {
  const offset = Math.round(lon / 15);

  if (lat > 35 && lat < 72 && lon > -10 && lon < 40) {
    // Europe
    if (lon < 5) return 'Europe/London';
    if (lon < 15) return 'Europe/Paris';
    if (lon < 25) return 'Europe/Berlin';
    return 'Europe/Moscow';
  }

  if (lat > 20 && lat < 40 && lon > -130 && lon < -60) {
    // North America
    if (lon < -115) return 'America/Los_Angeles';
    if (lon < -100) return 'America/Denver';
    if (lon < -85) return 'America/Chicago';
    return 'America/New_York';
  }

  if (lat > 10 && lat < 45 && lon > 30 && lon < 65) {
    // Middle East / Gulf
    if (lon > 50) return 'Asia/Dubai';
    if (lon > 40) return 'Asia/Riyadh';
    return 'Africa/Cairo';
  }

  if (lat > 20 && lat < 40 && lon > -20 && lon < 15) {
    // North Africa
    if (lon < -5) return 'Africa/Casablanca';
    if (lon < 10) return 'Africa/Algiers';
    return 'Africa/Tunis';
  }

  // Default: use UTC offset
  if (offset >= 0) {
    return `Etc/GMT-${offset}`;
  }
  return `Etc/GMT+${Math.abs(offset)}`;
}

/**
 * Search for cities by query
 * @param query - Search query (city name)
 * @param limit - Maximum number of results (default: 5)
 */
async function searchCities(query: string, limit: number = 5): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    lang: 'fr',
  });

  try {
    const response = await fetch(`${PHOTON_API}?${params.toString()}`);

    if (!response.ok) {
      console.error('[Geocoding] API error:', response.status);
      return [];
    }

    const data: PhotonResponse = await response.json();

    return data.features
      .filter((f) => f.properties.country)
      .map((f) => {
        const [lon, lat] = f.geometry.coordinates;
        const name = f.properties.name || f.properties.city || f.properties.county || f.properties.state || '';
        const country = f.properties.country || '';

        return {
          name,
          country,
          latitude: lat,
          longitude: lon,
          displayName: `${name}, ${country}`,
          timezone: getTimezoneFromCoordinates(lat, lon),
        };
      });
  } catch (error) {
    console.error('[Geocoding] Network error:', error);
    return [];
  }
}

/**
 * Debounce helper for search input
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Geocoding Service
 */
export const GeocodingService = {
  searchCities,
  debounce,
};
