/**
 * A type of svelte store that stores data in the local storage
 */

import { writable, type Writable } from 'svelte/store'

/**
 * Crea un writable que se guarda en el local storage
 * 
 * @param {string} key La clave del local storage
 * @param {T} initialValue El valor inicial
 * @returns {Writable<T>}
 */
export function storable<T>(key: string, initialValue: T): Writable<T> {
  // recuperar el valor del local storage si existe
  const saved = localStorage.getItem(key)

  // crear el writable con la información del local storage
  const store = writable<T>(saved ? JSON.parse(saved) : initialValue)

  // registrar los cambios en el local storage
  store.subscribe((val) => {
    localStorage.setItem(key, JSON.stringify(val))
  })

  return store
}
