import test = require('blue-tape')
import { Types, compile, assert } from '../index'

test('object', t => {
  t.test('properties', t => {
    const schema = new Types.Object({
      properties: {
        username: new Types.String()
      }
    })

    const validate = compile(schema)

    t.test('accept valid properties', t => {
      return validate({ username: 'hello' })
    })

    t.test('error on invalid properties', t => {
      t.plan(2)

      return validate({ username: 123 })
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].path, ['username'])
        })
    })
  })

  t.test('property types', t => {
    const schema = new Types.Object({
      propertyTypes: [
        [
          new Types.String({ pattern: '^[0-9]+$' }),
          new Types.String()
        ]
      ]
    })

    const validate = compile(schema)

    t.test('is structural type', t => {
      t.equal(assert(schema, { '123': 'abc' }), 3)
      t.end()
    })

    t.test('accept valid property types', t => {
      return validate({ '123': '123', '456': '456' })
        .then(function (res) {
          t.equal(res[123], '123')
          t.equal(res[456], '456')
        })
    })

    t.test('error on bad property type check', t => {
      t.plan(2)

      return validate({ '123': 123 })
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].path, ['123'])
        })
    })
  })

  t.test('key count', t => {
    const schema = new Types.Object({
      propertyTypes: [
        [
          new Types.Any(),
          new Types.Number()
        ]
      ],
      minKeys: 2
    })

    const validate = compile(schema)

    t.test('is structural type', t => {
      t.throws(() => assert(schema, { a: 123 }))
      t.equal(assert(schema, { a: 123, b: 456 }), 5)
      t.end()
    })

    t.test('accept valid property types', t => {
      return validate({ a: 123, b: 456 })
        .then(function (res) {
          t.equal(res.a, 123)
          t.equal(res.b, 456)
        })
    })

    t.test('error on bad property count', t => {
      t.plan(2)

      return validate({ a: 123 })
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].path, [])
        })
    })
  })
})
