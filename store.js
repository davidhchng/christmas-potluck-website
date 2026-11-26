// Tiny storage layer with one interface and two backends:
//   - Firebase Firestore (shared, realtime) when FIREBASE_CONFIG is set
//   - localStorage (demo mode, this browser only) otherwise
//
// store.subscribe(collection, callback)  -> callback(items[]) on every change
// store.add(collection, data)
// store.remove(collection, id)

import { FIREBASE_CONFIG } from "./config.js";

const FIREBASE_VERSION = "10.12.2";

export async function createStore() {
  if (FIREBASE_CONFIG) {
    try {
      return await firebaseStore(FIREBASE_CONFIG);
    } catch (err) {
      console.error("Firebase failed to load, falling back to demo mode", err);
    }
  }
  return localStore();
}

async function firebaseStore(config) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const { initializeApp } = await import(`${base}/firebase-app.js`);
  const { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } =
    await import(`${base}/firebase-firestore.js`);

  const db = getFirestore(initializeApp(config));

  return {
    mode: "firebase",
    subscribe(col, cb) {
      const q = query(collection(db, col), orderBy("created", "asc"));
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    },
    add(col, data) {
      return addDoc(collection(db, col), { ...data, created: Date.now() });
    },
    remove(col, id) {
      return deleteDoc(doc(db, col, id));
    },
  };
}

function localStore() {
  const key = (col) => `potluck:${col}`;
  const listeners = {};

  const read = (col) => {
    try {
      return JSON.parse(localStorage.getItem(key(col))) || [];
    } catch {
      return [];
    }
  };
  const write = (col, items) => {
    localStorage.setItem(key(col), JSON.stringify(items));
    (listeners[col] || []).forEach((cb) => cb(items));
  };

  // Keep multiple tabs in sync
  window.addEventListener("storage", (e) => {
    const col = e.key?.replace("potluck:", "");
    if (col && listeners[col]) listeners[col].forEach((cb) => cb(read(col)));
  });

  return {
    mode: "local",
    subscribe(col, cb) {
      (listeners[col] ||= []).push(cb);
      cb(read(col));
    },
    async add(col, data) {
      const item = { ...data, id: crypto.randomUUID(), created: Date.now() };
      write(col, [...read(col), item]);
    },
    async remove(col, id) {
      write(col, read(col).filter((i) => i.id !== id));
    },
  };
}
