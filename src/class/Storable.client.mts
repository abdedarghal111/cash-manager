/**
 * A type of svelte store that stores data in the local storage
 */

import { writable, type Writable } from 'svelte/store';

export function storable<T>(key: string, initialValue: T): Writable<T> {
  const isBrowser = typeof window !== 'undefined';
  const saved = isBrowser ? localStorage.getItem(key) : null;

  const store = writable<T>(saved ? JSON.parse(saved) : initialValue);

  if (isBrowser) {
    store.subscribe((val) => {
      localStorage.setItem(key, JSON.stringify(val));
    });
  }

  return store;
}
