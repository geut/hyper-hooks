import { useCallback, useContext, useEffect, useState } from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'

import pump from 'pump'
import hypercore from 'hypercore'
import { keyPair } from 'hypercore-crypto'

import { HyperContext } from './hyper'
import { StorageContext } from './storage'

export function HypercoreProvider ({ id = 'default', config = {}, children }) {
  const [feed, setFeed] = useState()
  const { hypers } = useContext(HyperContext)
  const { getStorage } = useContext(StorageContext)

  useDeepCompareEffect(() => {
    let { key, secretKey, ...options } = config

    if (!key) {
      ({ publicKey: key, secretKey } = keyPair())
    }

    const storage = getStorage(key.toString('hex'))

    const feed = hypercore(storage, key, { secretKey, ...options })

    feed.ready(() => {
      hypers.set(id, feed)
      setFeed(feed)
    })
  }, [config])

  return (feed ? children : null)
}

function feedData (feed) {
  return function useData (readStreamOpts = {}) {
    const [data, setData] = useState()

    useEffect(() => {
      if (!feed) return

      const stream = feed.createReadStream({
        live: true,
        ...readStreamOpts
      })

      stream.on('data', setData)
      stream.on('error', console.error)

      return function () {
        stream.removeListener('data', setData)
        stream.removeListener('error', console.error)
      }
    }, [feed])

    return [data]
  }
}

function feedAppend (feed) {
  return function useAppend () {
    return async function append (data) {
      if (!feed.writable) return
      return feed.append(data)
    }
  }
}

function feedValue (feed) {
  return function (readStreamOpts = {}) {
    return {
      value: feedData(feed)(readStreamOpts)[0],
      append: feedAppend(feed)
    }
  }
}

function feedReplicate (feed) {
  return function replicate (socket, initiator, opts = {}) {
    const stream = feed.replicate(initiator, {
      live: true,
      ...opts
    })

    pump(socket, stream, socket)

    return stream
  }
}

export function useHypercore (id = 'default') {
  const { hypers } = useContext(HyperContext)
  const [feed, setFeed] = useState(hypers.get(id))

  useEffect(() => {
    const feed = hypers.get(id)

    if (!feed) {
      setFeed(null)
      return
    }

    setFeed(feed)
  }, [id])

  const replicate = useCallback(feedReplicate(feed), [feed])
  const useData = useCallback(feedData(feed), [feed])
  const useAppend = useCallback(feedAppend(feed), [feed])
  const useValue = useCallback(feedValue(feed), [feed])

  return {
    feed,
    useData,
    useAppend,
    useValue,
    replicate
  }
}
