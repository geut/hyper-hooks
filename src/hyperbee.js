import { useCallback, useContext, useState, useEffect } from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'

import { keyPair } from 'hypercore-crypto'
import Hyperbee from 'hyperbee'
import hypercore from 'hypercore'
import pump from 'pump'
import bufferJsonEncoding from 'buffer-json-encoding'

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
        } else if (initialValue !== undefined) {
          await db.put(key, initialValue)
        }

        // Reactive
        stream = db.createHistoryStream({
          live: true,
          gte: db.version
        })

        let raf
        for await (const data of stream) {
          if (data.key === key) {
            if (raf) {
              window.cancelAnimationFrame(raf)
            }

            raf = window.requestAnimationFrame(() => {
              setValue(data.value)
            })
          }
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

function dbReplicator (db) {
  return function replicator (socket, info) {
    const stream = db.feed.replicate(info.initiator, {
      encrypt: true,
      live: true
    })

    pump(socket, stream, socket)
  }
}

export function useHyperbee (id = 'default') {
  const { hypers } = useContext(HyperContext)

  const db = hypers.get(id)

  const replicator = useCallback(dbReplicator(db), [db])

  const useBatch = useCallback(dbBatch(db), [db])
  const useDel = useCallback(dbDel(db), [db])
  const useGet = useCallback(dbGet(db), [db])
  const usePut = useCallback(dbPut(db), [db])
  const useValue = useCallback(dbValue(db), [db])

  return {
    db,
    useBatch,
    useDel,
    useGet,
    usePut,
    useValue,
    replicator
  }
}
