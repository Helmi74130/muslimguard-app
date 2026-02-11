/**
 * Geocoding Service - MuslimGuard
 * Uses OpenStreetMap Nominatim API for city search
 * https://nominatim.org/release-docs/develop/api/Search/
 */

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

/**
 * City search result from Nominatim API
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
 * Raw Nominatim API response
 */
interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  type: string;
  class: string;
}

/**
 * Get timezone from coordinates using a simple approximation
 * For more accuracy, we could use a timezone API, but this is good enough
 */
function getTimezoneFromCoordinates(lat: number, lon: number): string {
  // Simple timezone estimation based on longitude
  // Each 15 degrees of longitude = 1 hour offset
  const offset = Math.round(lon / 15);

  // Common timezone mappings for better accuracy
  // This is a simplified approach - for production, use a proper timezone API
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
 * Extract city name from Nominatim address
 */
function extractCityName(address: NominatimResult['address']): string {
  if (!address) return '';
  return address.city || address.town || address.village || address.municipality || address.county || address.state || '';
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
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    'accept-language': 'fr', // French results
    featuretype: 'city', // Prefer cities
  });

  try {
    const response = await fetch(`${NOMINATIM_API}?${params.toString()}`, {
      headers: {
        'User-Agent': 'MuslimGuard/1.0 (https://muslimguard.app)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error('[Geocoding] API error:', response.status);
      return [];
    }

    const results: NominatimResult[] = await response.json();

    // Filter and map results
    return results
      .filter((r) => r.address?.country) // Must have a country
      .map((r) => {
        const lat = parseFloat(r.lat);
        const lon = parseFloat(r.lon);
        const cityName = extractCityName(r.address);
        const country = r.address?.country || '';

        return {
          name: cityName || r.display_name.split(',')[0],
          country,
          latitude: lat,
          longitude: lon,
          displayName: `${cityName || r.display_name.split(',')[0]}, ${country}`,
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
  let timeout: NodeJS.Timeout | null = null;

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
