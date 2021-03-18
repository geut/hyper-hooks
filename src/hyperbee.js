import { useCallback, useContext, useState, useEffect } from 'react'
import { keyPair } from 'hypercore-crypto'
import useDeepCompareEffect from 'use-deep-compare-effect'
import Hyperbee from 'hyperbee'
import hypercore from 'hypercore'
import pump from 'pump'
import bufferJsonEncoding from 'buffer-json-encoding'

import { HyperbeeLiveStream } from '@geut/hyperbee-live-stream'

import { HyperContext } from './hyper'
import { StorageContext } from './storage'

export function HyperbeeProvider ({ id = 'default', config = {}, children }) {
  const [db, setDb] = useState()
  const { hypers } = useContext(HyperContext)
  const { getStorage } = useContext(StorageContext)

  const { feed, ...options } = config

  useDeepCompareEffect(() => {
    let dbFeed = feed
    if (!dbFeed) {
      let { key, secretKey } = config

      if (!key) {
        ({ publicKey: key, secretKey } = keyPair())
      }

      const storage = getStorage(key.toString('hex'))

      dbFeed = hypercore(storage, key, { secretKey })
    }

    const db = new Hyperbee(dbFeed, {
      keyEncoding: 'utf-8',
      valueEncoding: bufferJsonEncoding,
      ...options
    })

    db.ready().then(() => {
      hypers.set(id, db)
      setDb(db)
    })
  }, [config])

  return (db ? children : null)
}

function dbGet (db) {
  return function useGet (key, initialValue) {
    const [value, setValue] = useState(initialValue)

    const dbKey = db?.feed?.key.toString('hex')

    useEffect(() => {
      if (!db) return

      let stream

      ;(async () => {
        // Current value
        const data = await db.get(key)

        if (data) {
          setValue(data.value)
        } else if (initialValue !== undefined && db.feed.writable) {
          await db.put(key, initialValue)
        }

        // stream = db.createHistoryStream({
        //   live: true,
        //   gte: db.version
        // })

        stream = new HyperbeeLiveStream(db, { gte: key, lte: key })

        let raf
        for await (const data of stream) {
          if (data.key !== key) continue

          if (raf) {
            window.cancelAnimationFrame(raf)
          }

          raf = window.requestAnimationFrame(() => {
            setValue(data.value)
          })
        }
      })()
    }, [dbKey, key])

    return [value]
  }
}

function dbPut (db) {
  return function usePut (key) {
    return async function put (value) {
      if (!db.feed.writable) return
      return db.put(key, value)
    }
  }
}

function dbDel (db) {
  return function useDel (key) {
    return async function del () {
      if (!db.feed.writable) return
      return db.del(key)
    }
  }
}

function dbBatch (db) {
  return function batch () {
    if (db.feed.writable) {
      return db.batch()
    }
  }
}

function dbValue (db) {
  return function useValue (key, initialValue) {
    return {
      value: dbGet(db)(key, initialValue)[0],
      put: dbPut(db)(key),
      del: dbDel(db)(key),
      batch: dbBatch(db)
    }
  }
}

function dbReplicate (db) {
  return function replicate (socket, initiator, opts = {}) {
    const stream = db.feed.replicate(initiator, {
      live: true,
      ...opts
    })

    pump(socket, stream, socket)

    return stream
  }
}

export function useHyperbee (id = 'default') {
  const { hypers } = useContext(HyperContext)

  const db = hypers.get(id)
  const dbKey = db?.feed?.key.toString('hex')

  const replicate = useCallback(dbReplicate(db), [dbKey])
  const useBatch = useCallback(dbBatch(db), [dbKey])
  const useDel = useCallback(dbDel(db), [dbKey])
  const useGet = useCallback(dbGet(db), [dbKey])
  const usePut = useCallback(dbPut(db), [dbKey])
  const useValue = useCallback(dbValue(db), [dbKey])

  return {
    db,
    useBatch,
    useDel,
    useGet,
    usePut,
    useValue,
    replicate
  }
}

export function useSubHyperbee (db, prefix, options) {
  const subDb = db.sub(prefix, options)

  const replicate = useCallback(dbReplicate(subDb), [subDb])
  const useBatch = useCallback(dbBatch(subDb), [subDb])
  const useDel = useCallback(dbDel(subDb), [subDb])
  const useGet = useCallback(dbGet(subDb), [subDb])
  const usePut = useCallback(dbPut(subDb), [subDb])
  const useValue = useCallback(dbValue(subDb), [subDb])

  return {
    db: subDb,
    useBatch,
    useDel,
    useGet,
    usePut,
    useValue,
    replicate
  }
}
