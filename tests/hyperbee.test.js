import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { keyPair } from 'hypercore-crypto'

import { HyperProvider, HyperbeeProvider, StorageProvider, useHyperbee } from '../src'
import { act } from 'react-test-renderer'

const HyperWrapper = ({ children }) => (
  <StorageProvider>
    <HyperProvider>
      {children}
    </HyperProvider>
  </StorageProvider>
)

const hyperbeeWrapper = props => ({ children }) => (
  <HyperWrapper>
    <HyperbeeProvider {...props}>
      {children}
    </HyperbeeProvider>
  </HyperWrapper>
)

const multipleHyperbeeWrapper = ({ keys }) => ({ children }) => {
  const TopHyperbeeProvider = hyperbeeWrapper({ id: 'hyper-1', config: { key: keys.hyper1 } })

  return (
    <TopHyperbeeProvider>
      <HyperbeeProvider id='hyper-2' config={{ key: keys.hyper2 }}>
        {children}
      </HyperbeeProvider>
    </TopHyperbeeProvider>
  )
}

async function createHyperbee ({ id }) {
  const { result, waitForNextUpdate } = renderHook(() => useHyperbee(id), { wrapper: hyperbeeWrapper({ id }) })

  await waitForNextUpdate()

  return { db: result.current.db, result, waitForNextUpdate }
}

test('new hyperbee', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useHyperbee(), { wrapper: hyperbeeWrapper() })

  await waitForNextUpdate()

  const { db } = result.current

  expect(db).not.toBeNull()
})

test('use default hyperbee', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useHyperbee('default'), { wrapper: hyperbeeWrapper() })

  await waitForNextUpdate()
  const { db } = result.current

  expect(db).not.toBeNull()
})

test('return same hyperbee on multiple calls', async () => {
  const { result, waitForNextUpdate } = renderHook(
    () => [useHyperbee(), useHyperbee()],
    { wrapper: hyperbeeWrapper() }
  )

  await waitForNextUpdate()
  const [{ db }, { db: db1 }] = result.current

  expect(db.feed.key.toString('hex')).toBe(db1.feed.key.toString('hex'))
})

test('return correct hyperbee on multiple providers', async () => {
  const keys = {
    hyper1: keyPair().publicKey,
    hyper2: keyPair().publicKey
  }

  const { result, waitForNextUpdate } = renderHook(
    () => [useHyperbee('hyper-1'), useHyperbee('hyper-2')],
    { wrapper: multipleHyperbeeWrapper({ keys }) }
  )

  await waitForNextUpdate()
  const [{ db }, { db: db1 }] = result.current

  expect(db.feed.key.toString('hex')).toBe(keys.hyper1.toString('hex'))
  expect(db1.feed.key.toString('hex')).toBe(keys.hyper2.toString('hex'))
})

test('useGet', async () => {
  const { db, result: { current: { useGet } } } = await createHyperbee({ id: 'hyper-1' })
  const { result, waitForNextUpdate } = renderHook(() => useGet('a'))

  const value = Date.now()

  await act(async () => db.put('a', value))

  await act(async () => {
    await waitForNextUpdate()
    expect(result.current).toEqual([value])
  })
})

test('useGet live', async () => {
  const { db, result: { current: { useGet } } } = await createHyperbee({ id: 'hyper-1' })
  const { result, waitForNextUpdate } = renderHook(() => useGet('a'))

  let value = Date.now()

  await act(async () => {
    // eslint-disable-next-line
    for (const _ of Array.from({ length: 10 })) {
      value = Date.now()
      await db.put('a', value)
      await waitForNextUpdate()
      expect(result.current).toEqual([value])
    }
  })
})
