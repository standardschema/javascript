import test = require('blue-tape')
import { Types, compile } from '../index'

test('whitelist', t => {
  const schema = new Types.Whitelist({
    whitelist: [1, 2, 3]
  })

  const validate = compile(schema)

  t.test('accept valid values', t => {
    return validate(2)
  })

  t.test('reject invalid values', t => {
    t.plan(2)

    return validate(10)
      .catch(function (err) {
        t.equal(err.errors.length, 1)
        t.deepEqual(err.errors[0].path, [])
      })
  })
})
