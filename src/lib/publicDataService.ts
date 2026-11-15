/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDocsFromCache,
  doc,
  getDoc,
  getDocFromCache,
} from 'firebase/firestore';
import { db } from './firebase';
import { NewsItem, BannerItem, EventItem, PersonItem, DownloadItem, BudgetYear } from '../types';

const CACHE_TTL_MS = 60_000; // 1 minute fresh window before background refresh

interface CacheEntry<T> {
  data: T;
  signature: string;
  fetchedAt: number;
}

let newsCache: CacheEntry<NewsItem[]> | null = null;
let newsInFlight: Promise<NewsItem[]> | null = null;

let bannersCache: CacheEntry<BannerItem[]> | null = null;
let bannersInFlight: Promise<BannerItem[]> | null = null;

let eventsCache: CacheEntry<EventItem[]> | null = null;
let eventsInFlight: Promise<EventItem[]> | null = null;

let peopleCache: CacheEntry<PersonItem[]> | null = null;
let peopleInFlight: Promise<PersonItem[]> | null = null;

let downloadsCache: CacheEntry<DownloadItem[]> | null = null;
let downloadsInFlight: Promise<DownloadItem[]> | null = null;

let budgetsCache: CacheEntry<BudgetYear[]> | null = null;
let budgetsInFlight: Promise<BudgetYear[]> | null = null;

function buildNewsSignature(items: NewsItem[]): string {
  return items
    .map((n) => `${n.id ?? ''}:${n.updatedAt ?? ''}:${n.views ?? 0}:${n.pinned ? 1 : 0}`)
    .join('|');
}

function sortNews(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function buildBannerSignature(items: BannerItem[]): string {
  return items.map((b) => `${b.id ?? ''}:${b.order ?? 0}:${b.title ?? ''}`).join('|');
}

function buildEventSignature(items: EventItem[]): string {
  return items.map((e) => `${e.id ?? ''}:${e.startAt ?? ''}:${e.title ?? ''}`).join('|');
}

function buildPeopleSignature(items: PersonItem[]): string {
  return items
    .map((p) => `${p.id ?? ''}:${p.yearTH ?? ''}:${p.updatedAt ?? ''}:${p.order ?? 0}`)
    .join('|');
}

function buildDownloadSignature(items: DownloadItem[]): string {
  return items
    .map((d) => `${d.id ?? ''}:${d.downloads ?? 0}:${d.createdAt ?? ''}:${d.title ?? ''}`)
    .join('|');
}

function buildBudgetSignature(items: BudgetYear[]): string {
  return items
    .map((b) => `${b.id ?? b.yearTH}:${b.totalBudget ?? 0}:${b.items?.length ?? 0}`)
    .join('|');
}

export function getCachedNewsSync(): NewsItem[] | null {
  return newsCache?.data ?? null;
}

export function getCachedBannersSync(): BannerItem[] | null {
  return bannersCache?.data ?? null;
}

export function getCachedEventsSync(): EventItem[] | null {
  return eventsCache?.data ?? null;
}

export function getCachedPeopleSync(): PersonItem[] | null {
  return peopleCache?.data ?? null;
}

export function getCachedDownloadsSync(): DownloadItem[] | null {
  return downloadsCache?.data ?? null;
}

export function getCachedBudgetsSync(): BudgetYear[] | null {
  return budgetsCache?.data ?? null;
}

/**
 * Fetch published news with memory cache, request deduplication,
 * and IndexedDB cache-first hydration for instant display.
 */
export async function loadPublishedNews(
  onUpdate?: (items: NewsItem[]) => void,
  forceRefresh = false
): Promise<NewsItem[]> {
  const now = Date.now();

  if (!forceRefresh && newsCache) {
    onUpdate?.(newsCache.data);
    if (now - newsCache.fetchedAt < CACHE_TTL_MS) {
      return newsCache.data;
    }
    // Stale: refresh silently in the background
    void fetchFreshNews(onUpdate);
    return newsCache.data;
  }

  return fetchFreshNews(onUpdate);
}

async function fetchFreshNews(onUpdate?: (items: NewsItem[]) => void): Promise<NewsItem[]> {
  if (newsInFlight) {
    const res = await newsInFlight;
    onUpdate?.(res);
    return res;
  }

  const newsQuery = query(collection(db, 'news'), where('published', '==', true));

  newsInFlight = (async () => {
    // 1. Try local IndexedDB cache immediately while server fetch runs
    if (!newsCache && onUpdate) {
      try {
        const cachedSnap = await getDocsFromCache(newsQuery);
        if (!cachedSnap.empty) {
          const cachedList: NewsItem[] = [];
          cachedSnap.forEach((d) => {
            cachedList.push({ id: d.id, ...d.data() } as NewsItem);
          });
          const sortedCached = sortNews(cachedList);
          newsCache = {
            data: sortedCached,
            signature: buildNewsSignature(sortedCached),
            fetchedAt: 0, // mark stale so server response still updates
          };
          onUpdate(sortedCached);
        }
      } catch {
        // Cache miss is expected on first visit
      }
    }

    // 2. Fetch latest from Firestore
    const snap = await getDocs(newsQuery);
    const items: NewsItem[] = [];
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as NewsItem);
    });
    const sorted = sortNews(items);
    const sig = buildNewsSignature(sorted);

    const changed = !newsCache || newsCache.signature !== sig;
    newsCache = {
      data: sorted,
      signature: sig,
      fetchedAt: Date.now(),
    };

    if (changed) {
      onUpdate?.(sorted);
    }
    return sorted;
  })();

  try {
    return await newsInFlight;
  } finally {
    newsInFlight = null;
  }
}

/**
 * Fetch a single news article, hydrating instantly from memory or IndexedDB cache
 * and syncing with the server in the background.
 */
export async function loadNewsArticle(
  id: string,
  onUpdate?: (item: NewsItem | null) => void
): Promise<NewsItem | null> {
  const fromMemory = newsCache?.data.find((n) => n.id === id);
  if (fromMemory) {
    onUpdate?.(fromMemory);
  } else {
    try {
      const cachedDoc = await getDocFromCache(doc(db, 'news', id));
      if (cachedDoc.exists()) {
        const item = { id: cachedDoc.id, ...cachedDoc.data() } as NewsItem;
        onUpdate?.(item);
      }
    } catch {
      // Cache miss is normal on first direct article visit
    }
  }

  const snap = await getDoc(doc(db, 'news', id));
  if (!snap.exists()) {
    onUpdate?.(null);
    return null;
  }

  const fresh = { id: snap.id, ...snap.data() } as NewsItem;

  // Keep memory list up to date if present
  if (newsCache) {
    const idx = newsCache.data.findIndex((n) => n.id === id);
    if (idx >= 0) {
      const next = [...newsCache.data];
      next[idx] = fresh;
      newsCache = {
        ...newsCache,
        data: next,
        signature: buildNewsSignature(next),
      };
    }
  }

  onUpdate?.(fresh);
  return fresh;
}

/**
 * Fetch active Hero banners with cache-first hydration
 */
export async function loadActiveBanners(
  onUpdate?: (items: BannerItem[]) => void
): Promise<BannerItem[]> {
  const now = Date.now();
  if (bannersCache) {
    onUpdate?.(bannersCache.data);
    if (now - bannersCache.fetchedAt < CACHE_TTL_MS) {
      return bannersCache.data;
    }
  }

  if (bannersInFlight) {
    const res = await bannersInFlight;
    onUpdate?.(res);
    return res;
  }

  const bannersRef = collection(db, 'banners');
  bannersInFlight = (async () => {
    if (!bannersCache && onUpdate) {
      try {
        const cachedSnap = await getDocsFromCache(bannersRef);
        if (!cachedSnap.empty) {
          const cachedList: BannerItem[] = [];
          cachedSnap.forEach((d) => {
            const item = { id: d.id, ...d.data() } as BannerItem;
            if (item.active !== false) cachedList.push(item);
          });
          cachedList.sort((a, b) => (a.order || 0) - (b.order || 0));
          bannersCache = {
            data: cachedList,
            signature: buildBannerSignature(cachedList),
            fetchedAt: 0,
          };
          onUpdate(cachedList);
        }
      } catch {
        // Ignore cache miss
      }
    }

    const snap = await getDocs(bannersRef);
    const list: BannerItem[] = [];
    snap.forEach((d) => {
      const item = { id: d.id, ...d.data() } as BannerItem;
      if (item.active !== false) list.push(item);
    });
    list.sort((a, b) => (a.order || 0) - (b.order || 0));

    const sig = buildBannerSignature(list);
    const changed = !bannersCache || bannersCache.signature !== sig;
    bannersCache = { data: list, signature: sig, fetchedAt: Date.now() };
    if (changed) onUpdate?.(list);
    return list;
  })();

  try {
    return await bannersInFlight;
  } finally {
    bannersInFlight = null;
  }
}

/**
 * Fetch published events with cache-first hydration
 */
export async function loadPublishedEvents(
  onUpdate?: (items: EventItem[]) => void
): Promise<EventItem[]> {
  const now = Date.now();
  if (eventsCache) {
    onUpdate?.(eventsCache.data);
    if (now - eventsCache.fetchedAt < CACHE_TTL_MS) {
      return eventsCache.data;
    }
  }

  if (eventsInFlight) {
    const res = await eventsInFlight;
    onUpdate?.(res);
    return res;
  }

  const eventsQuery = query(collection(db, 'events'), where('published', '==', true));
  eventsInFlight = (async () => {
    if (!eventsCache && onUpdate) {
      try {
        const cachedSnap = await getDocsFromCache(eventsQuery);
        if (!cachedSnap.empty) {
          const list: EventItem[] = [];
          cachedSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as EventItem));
          list.sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''));
          eventsCache = {
            data: list,
            signature: buildEventSignature(list),
            fetchedAt: 0,
          };
          onUpdate(list);
        }
      } catch {
        // Ignore cache miss
      }
    }

    const snap = await getDocs(eventsQuery);
    const list: EventItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as EventItem));
    list.sort((a, b) => (a.startAt || '').localeCompare(b.startAt || ''));

    const sig = buildEventSignature(list);
    const changed = !eventsCache || eventsCache.signature !== sig;
    eventsCache = { data: list, signature: sig, fetchedAt: Date.now() };
    if (changed) onUpdate?.(list);
    return list;
  })();

  try {
    return await eventsInFlight;
  } finally {
    eventsInFlight = null;
  }
}

/**
 * Fetch people directory with cache-first hydration
 */
export async function loadPeopleList(
  onUpdate?: (items: PersonItem[]) => void
): Promise<PersonItem[]> {
  const now = Date.now();
  if (peopleCache) {
    onUpdate?.(peopleCache.data);
    if (now - peopleCache.fetchedAt < CACHE_TTL_MS) {
      return peopleCache.data;
    }
  }

  if (peopleInFlight) {
    const res = await peopleInFlight;
    onUpdate?.(res);
    return res;
  }

  const peopleRef = collection(db, 'people');
  peopleInFlight = (async () => {
    if (!peopleCache && onUpdate) {
      try {
        const cachedSnap = await getDocsFromCache(peopleRef);
        if (!cachedSnap.empty) {
          const list: PersonItem[] = [];
          cachedSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as PersonItem));
          peopleCache = {
            data: list,
            signature: buildPeopleSignature(list),
            fetchedAt: 0,
          };
          onUpdate(list);
        }
      } catch {
        // Ignore cache miss
      }
    }

    const snap = await getDocs(peopleRef);
    const list: PersonItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PersonItem));

    const sig = buildPeopleSignature(list);
    const changed = !peopleCache || peopleCache.signature !== sig;
    peopleCache = { data: list, signature: sig, fetchedAt: Date.now() };
    if (changed) onUpdate?.(list);
    return list;
  })();

  try {
    return await peopleInFlight;
  } finally {
    peopleInFlight = null;
  }
}

/**
 * Fetch downloadable documents list with cache-first hydration
 */
export async function loadDownloads(
  onUpdate?: (items: DownloadItem[]) => void,
  forceRefresh = false
): Promise<DownloadItem[]> {
  const now = Date.now();
  if (!forceRefresh && downloadsCache) {
    onUpdate?.(downloadsCache.data);
    if (now - downloadsCache.fetchedAt < CACHE_TTL_MS) {
      return downloadsCache.data;
    }
  }

  if (downloadsInFlight) {
    const res = await downloadsInFlight;
    onUpdate?.(res);
    return res;
  }

  const downloadsRef = collection(db, 'downloads');
  downloadsInFlight = (async () => {
    if (!downloadsCache && onUpdate) {
      try {
        const cachedSnap = await getDocsFromCache(downloadsRef);
        if (!cachedSnap.empty) {
          const list: DownloadItem[] = [];
          cachedSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as DownloadItem));
          list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          downloadsCache = {
            data: list,
            signature: buildDownloadSignature(list),
            fetchedAt: 0,
          };
          onUpdate(list);
        }
      } catch {
        // Ignore cache miss
      }
    }

    const snap = await getDocs(downloadsRef);
    const list: DownloadItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DownloadItem));
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const sig = buildDownloadSignature(list);
    const changed = !downloadsCache || downloadsCache.signature !== sig;
    downloadsCache = { data: list, signature: sig, fetchedAt: Date.now() };
    if (changed) onUpdate?.(list);
    return list;
  })();

  try {
    return await downloadsInFlight;
  } finally {
    downloadsInFlight = null;
  }
}

/**
 * Fetch yearly budgets with cache-first hydration
 */
export async function loadBudgets(
  onUpdate?: (items: BudgetYear[]) => void,
  forceRefresh = false
): Promise<BudgetYear[]> {
  const now = Date.now();
  if (!forceRefresh && budgetsCache) {
    onUpdate?.(budgetsCache.data);
    if (now - budgetsCache.fetchedAt < CACHE_TTL_MS) {
      return budgetsCache.data;
    }
  }

  if (budgetsInFlight) {
    const res = await budgetsInFlight;
    onUpdate?.(res);
    return res;
  }

  const budgetsRef = collection(db, 'budgets');
  budgetsInFlight = (async () => {
    if (!budgetsCache && onUpdate) {
      try {
        const cachedSnap = await getDocsFromCache(budgetsRef);
        if (!cachedSnap.empty) {
          const list: BudgetYear[] = [];
          cachedSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as BudgetYear));
          budgetsCache = {
            data: list,
            signature: buildBudgetSignature(list),
            fetchedAt: 0,
          };
          onUpdate(list);
        }
      } catch {
        // Ignore cache miss
      }
    }

    const snap = await getDocs(budgetsRef);
    const list: BudgetYear[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BudgetYear));

    const sig = buildBudgetSignature(list);
    const changed = !budgetsCache || budgetsCache.signature !== sig;
    budgetsCache = { data: list, signature: sig, fetchedAt: Date.now() };
    if (changed) onUpdate?.(list);
    return list;
  })();

  try {
    return await budgetsInFlight;
  } finally {
    budgetsInFlight = null;
  }
}

export function prefetchNews(): void {
  void loadPublishedNews().catch(() => {});
}

export function invalidatePublicDataCache(
  target: 'news' | 'banners' | 'events' | 'people' | 'downloads' | 'budgets' | 'all' = 'all'
): void {
  if (target === 'news' || target === 'all') newsCache = null;
  if (target === 'banners' || target === 'all') bannersCache = null;
  if (target === 'events' || target === 'all') eventsCache = null;
  if (target === 'people' || target === 'all') peopleCache = null;
  if (target === 'downloads' || target === 'all') downloadsCache = null;
  if (target === 'budgets' || target === 'all') budgetsCache = null;
}
