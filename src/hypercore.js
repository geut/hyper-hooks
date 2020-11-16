import { useCallback, useContext, useEffect, useState } from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'

import hypercore from 'hypercore'

import { HyperContext } from './hyper'
import { StorageContext } from './storage'

export function HypercoreProvider ({ id = 'default', config = {}, children }) {
  const [feed, setFeed] = useState()
  const { hypers } = useContext(HyperContext)
  const { getStorage } = useContext(StorageContext)

  useDeepCompareEffect(() => {
    const { key, secretKey, ...options } = config

    const storage = getStorage(key.toString('hex'))

    const feed = hypercore(storage, key, { secretKey, ...options })

    hypers.set(id, feed)
    setFeed(feed)
  }, [config])

  return (feed ? children : null)
}

export function useHypercore (id = 'default', { readStreamOpts } = {}) {
  const { hypers } = useContext(HyperContext)
  const [feed, setFeed] = useState()
  const [data, setData] = useState()

  useEffect(() => {
    const hyper = hypers.get(id)

    if (!hyper) return

    let stream

    hyper.ready(() => {
      setFeed(hyper)

      stream = hyper.createReadStream({
        live: true,
        ...readStreamOpts
      })

      stream.on('data', setData)
      stream.on('error', console.error)
    })

    return function () {
      if (!stream) return

      stream.removeListener('data', setData)
      stream.removeListener('error', console.error)
    }
  }, [id])

  const append = useCallback(async function append (data) {
    await feed.append(data)
  }, [feed])

  return { feed, isReady: !!feed, append, data }
}
