import React, { createContext, useContext, useEffect } from 'react'

import discoverySwarmWebrtc from '@geut/discovery-swarm-webrtc'

const SwarmContext = createContext()

export function SwarmProvider ({ children, config = {}, handlers = {} }) {
  const swarm = discoverySwarmWebrtc(config)

  window.__HYPER_HOOKS__.swarm = swarm

  useEffect(() => {
    for (const event in handlers) {
      swarm.on(event, handlers[event])
    }

    return function () {
      for (const event in handlers) {
        swarm.removeListener(event, handlers[event])
      }
    }
  }, [])

  return (
    <SwarmContext.Provider value={{ swarm }}>
      {children}
    </SwarmContext.Provider>
  )
}

export function useJoin (topic) {
  const { swarm } = useContext(SwarmContext)

  useEffect(() => {
    swarm.join(Buffer.from(topic, 'hex'))

    return function leave () {
      swarm.leave(Buffer.from(topic, 'hex'))
    }
  }, [topic])

  return { swarm }
}

export function useSwarm ({ replicator } = {}) {
  const { swarm } = useContext(SwarmContext)

  useEffect(() => {
    if (!replicator) return

    swarm.on('connection', replicator)

    return function () {
      swarm.removeListener('connection', replicator)
    }
  }, [replicator])

  return { swarm }
}
