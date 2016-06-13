import test = require('blue-tape')
import { Types, compile } from '../index'

test('pattern', t => {
  t.test('basic', t => {
    const schema = new Types.Pattern({
      pattern: '^[a-z]+$'
    })

    const validate = compile(schema)

    t.test('accept valid input', t => {
      return validate('test')
        .then(function (result) {
          t.equal(result, 'test')
        })
    })

    t.test('structural check', t => {
      t.equal(schema._isType('TEST'), false)
      t.equal(schema._isType(123), false)
      t.equal(schema._isType('lower'), true)
      t.end()
    })

    t.test('reject invalid input', t => {
      t.plan(2)

      return validate('HEY!')
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].path, [])
        })
    })
  })
})
