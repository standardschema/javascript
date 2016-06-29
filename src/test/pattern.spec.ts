import test = require('blue-tape')
import { Types, compile, assert } from '../index'

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
      t.throws(() => assert(schema, 'TEST'))
      t.throws(() => assert(schema, 123))
      t.equal(assert(schema, 'lower'), 3)
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
