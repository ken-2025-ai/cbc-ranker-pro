/**
 * IndexedDB wrapper for large dataset caching
 */

const DB_NAME = "CBCProCache";
const DB_VERSION = 1;

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

const STORES = {
  STUDENTS: "students_cache",
  MARKS: "marks_cache",
  SUBJECTS: "subjects_cache",
  CLASSES: "classes_cache",
  GENERAL: "general_cache"
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "key" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("expiresAt", "expiresAt", { unique: false });
        }
      });
    };
  });
}

/**
 * Store data in IndexedDB cache
 */
export async function cacheData(
  storeName: keyof typeof STORES,
  key: string,
  data: any,
  ttlMinutes: number = 60 * 24 * 7 // 7 days - aggressive client-side caching
): Promise<void> {
  const db = await openDB();
  const store = STORES[storeName];
  
  const entry: CacheEntry = {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], "readwrite");
    const objectStore = transaction.objectStore(store);
    const request = objectStore.put(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve data from IndexedDB cache
 */
export async function getCachedData<T>(
  storeName: keyof typeof STORES,
  key: string
): Promise<T | null> {
  const db = await openDB();
  const store = STORES[storeName];
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], "readonly");
    const objectStore = transaction.objectStore(store);
    const request = objectStore.get(key);

    request.onsuccess = () => {
      const entry: CacheEntry | undefined = request.result;
      
      // Check if data exists and hasn't expired
      if (!entry) {
        resolve(null);
        return;
      }
      
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        // Expired - delete and return null
        objectStore.delete(key);
        resolve(null);
        return;
      }
      
      resolve(entry.data as T);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cached data from a specific store
 */
export async function clearCachedStore(storeName: keyof typeof STORES): Promise<void> {
  const db = await openDB();
  const store = STORES[storeName];
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], "readwrite");
    const objectStore = transaction.objectStore(store);
    const request = objectStore.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clean up expired entries from all stores
 */
export async function cleanupExpiredCache(): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  
  for (const store of Object.values(STORES)) {
    const transaction = db.transaction([store], "readwrite");
    const objectStore = transaction.objectStore(store);
    const index = objectStore.index("expiresAt");
    const request = index.openCursor();
    
    await new Promise<void>((resolve) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry: CacheEntry = cursor.value;
          if (entry.expiresAt && entry.expiresAt < now) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

/**
 * Limit cache size per store (increased for device-focused caching)
 */
const MAX_ENTRIES_PER_STORE = 500;

export async function enforceStorageLimit(storeName: keyof typeof STORES): Promise<void> {
  const db = await openDB();
  const store = STORES[storeName];
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([store], "readwrite");
    const objectStore = transaction.objectStore(store);
    const countRequest = objectStore.count();
    
    countRequest.onsuccess = () => {
      const count = countRequest.result;
      
      if (count > MAX_ENTRIES_PER_STORE) {
        // Remove oldest entries
        const index = objectStore.index("timestamp");
        const cursorRequest = index.openCursor();
        let removed = 0;
        const toRemove = count - MAX_ENTRIES_PER_STORE;
        
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && removed < toRemove) {
            cursor.delete();
            removed++;
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        cursorRequest.onerror = () => reject(cursorRequest.error);
      } else {
        resolve();
      }
    };
    
    countRequest.onerror = () => reject(countRequest.error);
  });
}

// Auto cleanup on load (more aggressive)
if (typeof window !== 'undefined') {
  cleanupExpiredCache().catch(console.error);
  
  // Enforce storage limits on all stores
  Object.keys(STORES).forEach(storeName => {
    enforceStorageLimit(storeName as keyof typeof STORES).catch(console.error);
  });
}
