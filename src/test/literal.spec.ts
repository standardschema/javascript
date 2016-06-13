import test = require('blue-tape')
import { Types, compile } from '../index'

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
      t.equal(schema._isType('test'), true)
      t.equal(schema._isType('foo'), false)
      t.equal(schema._isType(123), false)
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
