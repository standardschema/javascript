import test = require('blue-tape')
import { Types, compile } from '../index'

test('array', t => {
  t.test('min items', t => {
    const schema = new Types.Array({
      items: new Types.Any(),
      minItems: 2
    })

    const validate = compile(schema)

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
})
