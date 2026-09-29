import { ScannedDocument } from '../types';

const DB_NAME = 'KM_Ouargla_Faculty_ScannedDocs_DB_v1';
const STORE_NAME = 'employee_scanned_documents';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('employeeId', 'employeeId', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save a newly scanned or uploaded document into IndexedDB
 */
export async function saveScannedDocument(doc: ScannedDocument): Promise<ScannedDocument> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(doc);

    request.onsuccess = () => resolve(doc);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all scanned documents for a specific employee
 */
export async function getDocumentsByEmployee(employeeId: number): Promise<ScannedDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('employeeId');
    const request = index.getAll(employeeId);

    request.onsuccess = () => {
      const results = (request.result as ScannedDocument[]) || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all scanned documents across all employees
 */
export async function getAllScannedDocuments(): Promise<ScannedDocument[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as ScannedDocument[]) || [];
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a specific scanned document by ID
 */
export async function getDocumentById(id: string): Promise<ScannedDocument | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as ScannedDocument) || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a scanned document by ID
 */
export async function deleteScannedDocument(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get count of documents per employee ID (e.g. { 1: 3, 2: 1 })
 */
export async function getDocumentCountsByEmployee(): Promise<Record<number, number>> {
  try {
    const all = await getAllScannedDocuments();
    const counts: Record<number, number> = {};
    for (const doc of all) {
      counts[doc.employeeId] = (counts[doc.employeeId] || 0) + 1;
    }
    return counts;
  } catch (err) {
    console.error('Failed to get document counts', err);
    return {};
  }
}
