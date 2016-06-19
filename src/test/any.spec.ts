import test = require('blue-tape')
import { Types, compile } from '../index'

test('any', t => {
  t.test('default value', t => {
    const schema = new Types.Any({
      default: 123
    })

    const validate = compile(schema)

    t.test('structural test', t => {
      t.equal(schema._isType(null), 1)
      t.equal(schema._isType('abc'), 1)
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
  })
})
