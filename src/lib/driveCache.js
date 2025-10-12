// src/lib/driveCache.js

import { openDB } from 'idb';

const DB_NAME = 'orbitos-drive-cache';
const STORE_NAME = 'files';

let dbPromise; // We will not initialize this immediately.

/**
 * A server-safe function to initialize the IndexedDB connection.
 * It only runs in the browser and only creates the connection once.
 */
const getDb = () => {
  // If we are on the server, 'window' will be undefined.
  // In that case, we can't do anything, so we return null.
  if (typeof window === 'undefined') {
    return null;
  }

  // If the dbPromise hasn't been created yet, create it.
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      },
    });
  }

  return dbPromise;
};

export async function cacheDriveFiles(files) {
  const db = getDb();
  if (!db) return; // Do nothing if we're on the server.

  const dbInstance = await db;
  const tx = dbInstance.transaction(STORE_NAME, 'readwrite');
  await Promise.all(files.map((file) => tx.store.put(file)));
  await tx.done;
  console.log('Google Drive files cached successfully.');
}

export async function getCachedDriveFiles() {
  const db = getDb();
  if (!db) return []; // Return an empty array if on the server.

  const dbInstance = await db;
  const files = await dbInstance.getAll(STORE_NAME);
  console.log('Retrieved files from offline cache.');
  return files;
}

export async function clearDriveCache() {
  const db = getDb();
  if (!db) return; // Do nothing on the server.

  const dbInstance = await db;
  await dbInstance.clear(STORE_NAME);
  console.log('Google Drive offline cache cleared.');
}
