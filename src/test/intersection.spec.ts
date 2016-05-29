import test = require('blue-tape')
import { Types, compile } from '../index'

test('intersection', t => {
  const schema = new Types.Intersection({
    types: [
      new Types.Object({
        properties: {
          username: new Types.String()
        }
      }),
      new Types.Object({
        properties: {
          password: new Types.String()
        }
      })
    ]
  })

  const validate = compile(schema)

  t.test('accept valid input', t => {
    return validate({
      username: 'blakeembrey',
      password: 'hunter2'
    })
      .then(function (result) {
        t.equal(result.username, 'blakeembrey')
        t.equal(result.password, 'hunter2')
      })
  })

  t.test('reject invalid input', t => {
    t.plan(2)

    return validate({ username: 'blakeembrey' })
      .catch(function (err) {
        t.equal(err.errors.length, 1)
        t.deepEqual(err.errors[0].path, ['password'])
      })
  })
})
