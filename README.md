# Jaywalk

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Runtime type validations.

## Installation

```sh
npm install jaywalk --save
```

## Usage

```ts
import { Types, validate } from 'jaywalk'

const schema = new Types.Object({
  properties: {
    username: new Types.String({ minLength: 1, maxLength: 30, pattern: '^[A-Za-z0-9_]+$' })
  }
})

validate(schema, { username: 'hello' })
  .then(
    function (user) {
      console.log(user)
    },
    function (err) {
      console.log(err)
    }
  )
```

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/jaywalk.svg?style=flat
[npm-url]: https://npmjs.org/package/jaywalk
[downloads-image]: https://img.shields.io/npm/dm/jaywalk.svg?style=flat
[downloads-url]: https://npmjs.org/package/jaywalk
[travis-image]: https://img.shields.io/travis/blakeembrey/jaywalk.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/jaywalk
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/jaywalk.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/jaywalk?branch=master
