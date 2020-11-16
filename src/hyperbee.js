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

    hypers.set(id, db)
    setDb(db)
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

function dbBatch (db, ready) {
  return function batch () {
    if (ready && db.feed.writable) {
      return db.batch()
    }
  }
}

function dbValue (db, ready) {
  return function useValue (key, initialValue) {
    return {
      value: dbGet(db)(key, initialValue)[0],
      put: dbPut(db)(key),
      del: dbDel(db)(key),
      batch: dbBatch(db, ready)
    }
  }
}

function dbReplicator (db, ready) {
  return function replicator (socket, info) {
    if (!ready) return

    const stream = db.feed.replicate(info.initiator, {
      encrypt: true,
      live: true
    })

    pump(socket, stream, socket)
  }
}

export function useHyperbee (id = 'default') {
  const { hypers } = useContext(HyperContext)
  const [db, setDb] = useState(hypers.get(id))

  const [ready, setReady] = useState(false)
  useEffect(() => {
    const db = hypers.get(id)

    if (!db) {
      setReady(false)
      return
    }

    setDb(db)

    db.ready().then(() => setReady(true)).catch(console.error)
  }, [id])

  const replicator = useCallback(dbReplicator(db, ready), [db, ready])

  const useBatch = useCallback(dbBatch(db, ready), [db, ready])
  const useDel = useCallback(dbDel(db), [db, ready])
  const useGet = useCallback(dbGet(db), [db, ready])
  const usePut = useCallback(dbPut(db), [db, ready])
  const useValue = useCallback(dbValue(db, ready), [db, ready])

  return {
    db,
    isReady: ready,
    useBatch,
    useDel,
    useGet,
    usePut,
    useValue,
    replicator
  }
}
