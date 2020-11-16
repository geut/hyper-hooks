
import React, { createContext, useContext } from 'react'

import ram from 'random-access-memory'

export const StorageContext = createContext()

export function StorageProvider ({ children, storage = () => ram }) {
  const storages = new Map()

  function getStorage (key) {
    if (!storages.has(key)) {
      storages.set(key, storage(key))
    }

    return storages.get(key)
  }

  return (
    <StorageContext.Provider value={{ storages, getStorage }}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage (key) {
  const { getStorage } = useContext(StorageContext)

  return getStorage(key)
}
