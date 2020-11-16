
import React, { createContext } from 'react'

export const HyperContext = createContext()

export function HyperProvider ({ children }) {
  const hypers = new Map()

  return (
    <HyperContext.Provider value={{ hypers }}>
      {children}
    </HyperContext.Provider>
  )
}
