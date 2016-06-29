import test = require('blue-tape')
import { Types, Utils, compile, assert } from '../index'

test('any', t => {
  t.test('default value', t => {
    const schema = new Types.Any({
      default: 123
    })

    const validate = compile(schema)

    t.test('structural test', t => {
      t.equal(assert(schema, null), 1)
      t.equal(assert(schema, 'abc'), 1)
      t.end()
    })

    t.test('should use default value', t => {
      return validate(null)
        .then(res => {
          t.equal(res, 123)
        })
    })

    t.test('should use validation value', t => {
      return validate('abc')
        .then(res => {
          t.equal(res, 'abc')
        })
    })

    t.test('extend to new schema', t => {
      const newSchema = Utils.extendSchema(schema, { default: 456 })
      const validate = compile(newSchema)

      return validate(null)
        .then(res => {
          t.equal(res, 456)
        })
    })
  })
})
