import { Types, compile } from '../index'
import test = require('blue-tape')

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
})
