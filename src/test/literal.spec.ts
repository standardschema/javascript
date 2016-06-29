import test = require('blue-tape')
import { Types, compile, assert } from '../index'

test('literal', t => {
  t.test('basic', t => {
    const schema = new Types.Literal({
      value: 'test'
    })

    const validate = compile(schema)

    t.test('accept valid input', t => {
      return validate('test')
        .then(function (result) {
          t.equal(result, 'test')
        })
    })

    t.test('structural check', t => {
      t.equal(assert(schema, 'test'), 2)
      t.throws(() => assert(schema, 'foo'))
      t.throws(() => assert(schema, 123))
      t.end()
    })

    t.test('reject invalid input', t => {
      t.plan(2)

      return validate('hey')
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].path, [])
        })
    })
  })
})
