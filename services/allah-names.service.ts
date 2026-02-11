/**
 * Asma-ul-Husna (99 Names of Allah) Service
 * Uses islamicapi.com API with French translations
 */

export interface AllahName {
  number: number;
  name: string;        // Arabic
  transliteration: string;
  translation: string; // French
  meaning: string;     // French
  audio: string;       // Relative path
}

interface ApiResponse {
  code: number;
  status: string;
  data: {
    names: AllahName[];
    total: number;
  };
}

const API_BASE = 'https://islamicapi.com';
const API_KEY = '2DsuwCZZaoMsT7NCkl5NbQbrjiMyX604oQHF6A9vLcfa6A0u';
const LANGUAGE = 'fr';

let cachedNames: AllahName[] | null = null;

export const AllahNamesService = {
  /**
   * Fetch the 99 names of Allah in French
   * Results are cached in memory for the session
   */
  async getNames(): Promise<AllahName[]> {
    if (cachedNames) return cachedNames;

    const url = `${API_BASE}/api/v1/asma-ul-husna/?language=${LANGUAGE}&api_key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const json: ApiResponse = await response.json();

    if (json.code !== 200 || !json.data?.names) {
      throw new Error('Invalid API response');
    }

    cachedNames = json.data.names;
    return cachedNames;
  },

  /**
   * Get full audio URL from relative path
   */
  getAudioUrl(relativePath: string): string {
    return `${API_BASE}${relativePath}`;
  },

  /**
   * Clear cached data
   */
  clearCache(): void {
    cachedNames = null;
  },
};
