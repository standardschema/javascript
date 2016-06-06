import test = require('blue-tape')
import { Types, compile, Utils } from '../index'

test('number', t => {
  t.test('min', t => {
    const schema = new Types.Number({
      min: 10
    })

    const validate = compile(schema)

    t.test('should fail with `min`', t => {
      t.plan(2)

      return validate(5)
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'min')
        })
    })

    t.test('should pass with greater than min value', t => {
      return validate(30)
    })
  })

  t.test('min reference', t => {
    const schema = new Types.Object({
      properties: {
        a: new Types.Number({
          min: 10
        }),
        b: new Types.Number({
          min: Utils.ref(['a'], 1)
        })
      }
    })

    const validate = compile(schema)

    t.test('should fail with `min` reference', t => {
      t.plan(2)

      return validate({ a: 10, b: 5 })
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'min')
        })
    })

    t.test('should pass with greater than min value', t => {
      return validate({ a: 10, b: 15 })
    })
  })
})
