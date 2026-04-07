import { Incident } from "@/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface AppCache {
  incidents: CacheEntry<Incident[]> | null;
  lastFetch: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache: AppCache = {
  incidents: null,
  lastFetch: 0,
};

export function getCachedIncidents(): Incident[] | null {
  if (!cache.incidents) return null;
  
  const now = Date.now();
  if (now - cache.incidents.timestamp > CACHE_TTL) {
    console.log("Cache expired, clearing...");
    cache.incidents = null;
    return null;
  }
  
  console.log(`Cache hit! Returning ${cache.incidents.data.length} incidents`);
  return cache.incidents.data;
}

export function setCachedIncidents(incidents: Incident[]): void {
  cache.incidents = {
    data: incidents,
    timestamp: Date.now(),
  };
  cache.lastFetch = Date.now();
  console.log(`Cached ${incidents.length} incidents`);
}

export function clearCache(): void {
  cache.incidents = null;
  cache.lastFetch = 0;
  console.log("Cache cleared");
}

export function isCacheStale(): boolean {
  if (!cache.incidents) return true;
  return Date.now() - cache.incidents.timestamp > CACHE_TTL;
}

export function getCacheAge(): number {
  if (!cache.incidents) return 0;
  return Date.now() - cache.incidents.timestamp;
}

export function getCacheStats() {
  return {
    hasCache: !!cache.incidents,
    incidentCount: cache.incidents?.data.length || 0,
    ageMs: getCacheAge(),
    ttlMs: CACHE_TTL,
  };
}
