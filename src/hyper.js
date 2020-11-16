
import React, { createContext } from 'react'

export const HyperContext = createContext()

export function HyperProvider ({ children }) {
  const hypers = new Map()

  window.__HYPER_HOOKS__ = {
    hypers
  }

  return (
    <HyperContext.Provider value={{ hypers }}>
      {children}
    </HyperContext.Provider>
  )
}
