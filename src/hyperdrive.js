import { useCallback, useContext, useEffect, useState } from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'

import pump from 'pump'
import hyperdrive from 'hyperdrive'
import { keyPair } from 'hypercore-crypto'

import { HyperContext } from './hyper'
import { StorageContext } from './storage'

export function HyperdriveProvider ({ id = 'default', config = {}, children }) {
  const [drive, setDrive] = useState()
  const { hypers } = useContext(HyperContext)
  const { getStorage } = useContext(StorageContext)

  useDeepCompareEffect(() => {
    let { key, ...options } = config

    if (!key) {
      ({ publicKey: key } = keyPair())
    }

    const storage = getStorage(key.toString('hex'))

    const drive = hyperdrive(storage, key, options)

    drive.on('ready', () => {
      hypers.set(id, drive)
      setDrive(drive)
    })
  }, [config])

  return (drive ? children : null)
}

function driveReplicator (drive) {
  function replicator (socket, info) {
    const replicationOpts = {
      live: true,
      encrypt: true
    }

    const stream = drive.replicate(info.initiator, replicationOpts)

    pump(socket, stream, socket, err => {
      if (err) console.error('replication', err)
    })
  }

  return replicator
}

export function useHyperdrive (id = 'default') {
  const { hypers } = useContext(HyperContext)
  const [drive, setDrive] = useState(hypers.get(id))

  useEffect(() => {
    const drive = hypers.get(id)

    if (!drive) {
      setDrive(null)
      return
    }

    console.log('1')
    setDrive(drive)
  }, [id])

  const replicator = useCallback(driveReplicator(drive), [drive?.key.toString('hex')])

  return {
    drive,
    replicator
  }
}
