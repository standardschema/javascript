import test = require('blue-tape')
import { Types, compile, is } from '../index'

test('array', t => {
  t.test('min items', t => {
    const schema = new Types.Array({
      items: new Types.Any(),
      minItems: 2
    })

    const validate = compile(schema)

    t.test('should type check', t => {
      t.equal(is(schema, []), 2)
      t.equal(is(schema, ['test']), 3)
      t.equal(is(schema, 123), 0)
      t.end()
    })

    t.test('should fail with min items', t => {
      t.plan(2)

      return validate([1])
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'minItems')
        })
    })

    t.test('should pass with greater than min value', t => {
      return validate([1, 2, 3])
    })
  })

  t.test('map items to new types', t => {
    const schema = new Types.Array({
      items: new Types.Object({
        properties: {
          a: new Types.String()
        }
      })
    })

    const validate = compile(schema)

    t.test('use validated objects as result', t => {
      return validate([{ a: 'a', b: 'b' }])
        .then(res => {
          t.deepEqual(res, [{ a: 'a' }])
        })
    })
  })
})
