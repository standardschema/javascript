# Standard Schema

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> **Standard schema** is a vocabulary for validating data.

## Installation

```sh
npm install standardschema --save
```

## Usage

```ts
import { fromJSON, AnyType, IntegerType, StringType, ... } from 'standardschema'

const model = fromJSON({
  '@type': 'Object',
  'properties': [
    {
      '@type': 'Property',
      'key': 'foo',
      'value': { '@type': 'String' }
    }
  ]
})

model.isAssignable(new IntegerType()) //=> false
```

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/standardschema.svg?style=flat
[npm-url]: https://npmjs.org/package/standardschema
[downloads-image]: https://img.shields.io/npm/dm/standardschema.svg?style=flat
[downloads-url]: https://npmjs.org/package/standardschema
[travis-image]: https://img.shields.io/travis/standardschema/javascript.svg?style=flat
[travis-url]: https://travis-ci.org/standardschema/javascript
[coveralls-image]: https://img.shields.io/coveralls/standardschema/javascript.svg?style=flat
[coveralls-url]: https://coveralls.io/r/standardschema/javascript?branch=master
