# Standard Schema

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Runtime type validation.

## Installation

```sh
npm install standard-schema --save
```

## Usage

```ts
import { validationFunction } from 'standard-schema'

const validate = validationFunction({
  '@type': 'Record',
  property: [
    {
      '@type': 'Property',
      key: 'username',
      type: {
        '@type': 'String',
        minLength: 1,
        maxLength: 30,
        pattern: '^[A-Za-z0-9_]+$'
      }
    }
  ]
})

validate({ username: 'hello' }).then(...)
```

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/standard-schema.svg?style=flat
[npm-url]: https://npmjs.org/package/standard-schema
[downloads-image]: https://img.shields.io/npm/dm/standard-schema.svg?style=flat
[downloads-url]: https://npmjs.org/package/standard-schema
[travis-image]: https://img.shields.io/travis/standard-schema/javascript.svg?style=flat
[travis-url]: https://travis-ci.org/standard-schema/javascript
[coveralls-image]: https://img.shields.io/coveralls/standard-schema/javascript.svg?style=flat
[coveralls-url]: https://coveralls.io/r/standard-schema/javascript?branch=master
