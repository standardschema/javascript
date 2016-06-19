import test = require('blue-tape')
import { Types, compile } from '../index'

test('union', t => {
  t.test('basic', t => {
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
      t.plan(2)

      return validate({ foo: 'bar' })
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].path, [])
        })
    })
  })

  t.test('most specific path', t => {
    const schema = new Types.Union({
      types: [
        new Types.Object({
          properties: {
            userId: new Types.String()
          }
        }),
        new Types.Object({
          properties: {
            userId: new Types.String(),
            profileId: new Types.String()
          }
        })
      ]
    })

    const validate = compile(schema)

    t.test('validate with matching schema', t => {
      return validate({ userId: 'test' })
        .then(res => {
          t.equal(res.userId, 'test')
        })
    })

    t.test('validate with more specific schema', t => {
      return validate({ userId: 'test', profileId: 'more' })
        .then(res => {
          t.equal(res.userId, 'test')
          t.equal(res.profileId, 'more')
        })
    })
  })
})
