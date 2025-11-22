// IndexedDB wrapper for encrypted exam storage

interface StoredExam {
  examId: string;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  encryptedKey: ArrayBuffer;
  metadata: ExamMetadata;
  timestamp: number;
}

interface ExamMetadata {
  schoolId: string;
  schoolName: string;
  class: string;
  subject: string;
  examType: string;
  teacherId: string;
  teacherName: string;
  version: number;
  totalMarks: number;
  timeAllowed: number;
}

const DB_NAME = "CBCExamsDB";
const STORE_NAME = "encryptedExams";
const DB_VERSION = 1;

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "examId" });
        store.createIndex("schoolId", "metadata.schoolId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Store encrypted exam locally
 */
export async function storeEncryptedExam(exam: StoredExam): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(exam);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get encrypted exam by ID
 */
export async function getEncryptedExam(examId: string): Promise<StoredExam | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(examId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all exams for a school
 */
export async function getSchoolExams(schoolId: string): Promise<StoredExam[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("schoolId");
    const request = index.getAll(schoolId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete exam from local storage
 */
export async function deleteEncryptedExam(examId: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(examId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get storage size estimate
 */
export async function getStorageSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Clear old exams (keep last 30 days)
 */
export async function cleanupOldExams(daysToKeep: number = 30): Promise<number> {
  const db = await openDB();
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const request = index.openCursor();
    
    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.timestamp < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => reject(request.error);
  });
}
