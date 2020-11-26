# @geut/hyper-hooks

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

[![Made by GEUT][geut-badge]][geut-url]

React hooks for hyper world

`@geut/hyper-hooks` provides a set of React hooks and providers to work with `hyper` libraries like [hypercore](https://github.com/hypercore-protocol/hypercore) and [hyperbee](https://github.com/mafintosh/hyperbee)


## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Issues](#issues)
- [Contributing](#contributing)
- [License](#license)

## Install

```
$ npm install @geut/hyper-hooks
```
or
```
$ yarn add @geut/hyper-hooks
```

## Usage

```javascript
// ./App.js

import React from 'react'

import { 
  HyperProvider, 
  StorageProvider, 
  HypercoreProvider, 
  HyperbeeProvider
} from '@geut/hyper-hooks'

import Db from './components/Db'

function App () {
  return (
    <HyperProvider>
      <StorageProvider>
        <HyperbeeProvider>
          <Db />
        </HyperbeeProvider>
      </StorageProvider>
    </HyperProvider>
  )
}

export default App
```

```javascript
// ./components/Db.js

import React, { useEffect } from 'react'

import { useHyperbee } from '@geut/hyper-hooks'

function Db () {
  const { db, isReady, useGet, usePut, useValue } = useHyperbee()

  // db.get and db.put separately
  const [title] = useGet('title')
  const putTitle = usePut('title')

  // Shorthand for get/put
  const { value: description, put: putDescription } = useValue('description')

  useEffect(() => {
    const interval = setInterval(() => {
      putTitle(`New title - ${Date.now()}`)
      putDescription(`New description - ${Date.now()}`)
    }, 2000)

    return function () {
      clearInterval(interval)
    }
  }, [])

  if (!isReady) return null

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      <pre>Key: {db.feed.discoveryKey.toString('hex')}</pre>
    </div>
  )
}
```

## Api

### HyperProvider
Keeps reference to inner hyper elements. 

#### children
> `ReactElement` | _required_

React children.


### StorageProvider
Provides a storage layer where your hyper elements will be stored

#### children
> `ReactElement` | _required_

React children.

#### storage
> `function()` | defaults to: `() => RandomAccessMemory`

Function to create the storage.

### HypercoreProvider
Creates and provides an [hypercore](https://github.com/hypercore-protocol/hypercore) instance.

#### id
> `string` | defaults to `'default'`

Identifies your hypercore for access it later with [`useHypercore`](#useHypercore).

#### config
> `object`

Except for [`config.key`](#config.key) the rest of the config values are forwarded to the [Hypercore instance options](https://github.com/hypercore-protocol/hypercore#var-feed--hypercorestorage-key-options). 

#### config.key
> `Buffer` | defaults to `crypto.randomBytes(32)`

Hypercore feed public key.

### HyperbeeProvider
[hyperbee](https://github.com/mafintosh/hyperbee) provider.

#### id
> `string` | defaults to `'default'`

Identifies your hyperdrive for access it later with [`useHyperdrive`](#useHyperdrive).

#### config
> `object`

Except for [`config.feed`](#config.feed) the rest of the config values are forwarded to the [Hyperbee instance options](https://github.com/mafintosh/hyperbee#const-db--new-hyperbeefeed-options). 

#### config.feed
> `Hypercore`

Hypercore instance for this Hyperbee. If not provided a new one will be created with a random key pair.

## Issues

:bug: If you found an issue we encourage you to report it on [github](https://github.com/geut/hyper-hooks/issues). Please specify your OS and the actions to reproduce it.

## Contributing

:busts_in_silhouette: Ideas and contributions to the project are welcome. You must follow this [guideline](https://github.com/geut/hyper-hooks/blob/main/CONTRIBUTING.md).

## License

MIT © A [**GEUT**](http://geutstudio.com/) project

[geut-url]: https://geutstudio.com
[geut-badge]: https://img.shields.io/badge/Made%20By-GEUT-4f5186?style=for-the-badge&link=https://geutstudio.com&labelColor=white&logo=data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCABAAEADASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAABAYDBQACBwH/xAA0EAACAQMBBAcGBgMAAAAAAAABAgMABBEFBhIhQRMiMVFhgcEUIzJxkbFCUmKh0fAkcuH/xAAYAQADAQEAAAAAAAAAAAAAAAABAwQCAP/EACARAAMAAwACAgMAAAAAAAAAAAABAgMRIRIxBEEiM1H/2gAMAwEAAhEDEQA/AOgVlau6xoXdgqqMkk8AKV9U2oYs0WngBRw6VhxPyFamXXoDeiz1PUbmzuujQIUKgjIqGLXnz72FSO9TikfVbi6uXWSSaWRuzixNBx3VzCepNIvgTw+hpjwv+iGr3tM6xa30F2PdP1uangRRNc70fUbi4JLIVaPskXgM/wA076Ze+2W+WwJF4MPWlNaemajI2/GvYbWVlZQHCptZqLNKLGJsKoDSY5nkKorKzlvrlYIRlm5nsA7zWX8pnv55SfikJ/emPZGDcs7m6CguTuL5DPrVf64Me2F2mzNhAg6ZTO/MsSB9BW15s1pt1GVEPRHvQ+hqbTNT9sZ0kCpIOIA5ij5ZEijaSRgqqMkmpVkb7sMuWtoV73S49L3I4B7kjq57c881BZ6vFpuoKjq7dIvYBw8PtUOqX1xcSxoJXw8mQuewVW3vX1eFR+Fcn96OLVvpFzz8kM020kp4QwIvixzVpot5Je2bSTEFw5HAY7qUKadnIymm7x/G5I+3pTskzM8G4rqq6JGpI8E1wi8HR2H0NT7P6rcRKUEzYR9/czgEf0VabV2JgvhdKPdzdvg399aVG37K4Esfw/3hTU1S2NpNrSHqax9q/wAzTm3lY5KA4ZTQl2mo9CWljncL+cnA+tVVhqeSGt5mik5qDg/9o+XVb6aFonuDusMHqjP2qavjbfGTPX3xgTstrm4uGDSEYVV+woWPMKy3dzwd+JHcOQrdkgtyZpXJb87nJ8qqr68a7cKgIjB4DmadGNQjohs9i1C66Xqtvbx+EjIp10jaOMLBaPasDwRTGc5PyNJ1rb9EN5/jP7U17KaaZJvbpV6icI88z3+VG0vH8ipJJ8Ga8tIr22eCYZVh5g94pC1TTJtPmMU67yH4XxwYV0So54IriIxzRrIh7QwzSIyOTbWzlElkCcxtjwNedHeKMCVseDmnq72UgkJa1maL9LDeH81XvspfA9WSBh/sR6U9XD+zDQp+yTSNmR/MnJomG3SLiBlu80zQ7JXTH31xEg/Tlj6Vb2OzljaEO6meQc5OweVc8koOmUGjaFLfuss4MdsOOewv8v5p0ijSGNY41CoowAOQrbsr2p7t0zSWj//Z