import hypercore from 'hypercore'
import { renderHook } from '@testing-library/react-hooks'

import { useHypercore } from '../src'
import { keyPair } from 'hypercore-crypto'

test('Should create an hypercore', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useHypercore())

  expect(result.current.feed).toBeUndefined()

  await waitForNextUpdate()

  expect(result.current.feed).toBeInstanceOf(hypercore)
})

test('Use a public key', async () => {
  const key = keyPair().publicKey
  const { result, waitForNextUpdate } = renderHook(() => useHypercore({ key }))

  await waitForNextUpdate()

  const { feed } = result.current

  expect(feed.key.toString('hex')).toBe(key.toString('hex'))
  expect(feed.writable).toBeFalsy()
  expect(feed.readable).toBeTruthy()
})

test('Use a key pair', async () => {
  const { publicKey: key, secretKey } = keyPair()
  const { result, waitForNextUpdate } = renderHook(() => useHypercore({ key, secretKey }))

  await waitForNextUpdate()

  const { feed } = result.current

  expect(feed.key.toString('hex')).toBe(key.toString('hex'))
  expect(feed.secretKey.toString('hex')).toBe(secretKey.toString('hex'))
  expect(feed.writable).toBeTruthy()
  expect(feed.readable).toBeTruthy()
})

test('Create multiple feeds', async () => {
  const { result, waitForNextUpdate } = renderHook(() => ([
    useHypercore(),
    useHypercore()
  ]))

  await waitForNextUpdate()

  const [{ feed }, { feed: feed1 }] = result.current

  expect(feed.key.toString('hex')).not.toBe(feed1.key.toString('hex'))
})
