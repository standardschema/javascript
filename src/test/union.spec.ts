import test = require('blue-tape')
import { Types, compile } from '../index'

test('union', t => {
  const schema = new Types.Union({
    types: [
      new Types.Object({
        properties: {
          userId: new Types.String()
        }
      }),
      new Types.Object({
        properties: {
          profileId: new Types.String()
        }
      })
    ]
  })

  const validate = compile(schema)

  t.test('accept and return valid input', t => {
    return validate({
      userId: 'abc'
    })
      .then(function (result) {
        t.equal(result.userId, 'abc')
      })
  })

  t.test('reject invalid input', t => {
    t.plan(3)

    return validate({ foo: 'bar' })
      .catch(function (err) {
        t.equal(err.errors.length, 2)
        t.deepEqual(err.errors[0].path, ['userId'])
        t.deepEqual(err.errors[1].path, ['profileId'])
      })
  })
})
