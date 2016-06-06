import test = require('blue-tape')
import { Types, Utils, compile } from '../index'

test('omit', t => {
  t.test('omit value after validation', t => {
    const schema = new Types.Number({
      uses: [
        new Types.Omit()
      ]
    })

    const validate = compile(schema)

    t.test('fail against invalid pattern', t => {
      t.plan(2)

      return validate('101')
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'type')
        })
    })

    t.test('valid type but omit value', t => {
      return validate(100)
        .then(value => {
          t.equal(value, undefined)
        })
    })
  })

  t.test('omit value from object', t => {
    const schema = new Types.Object({
      properties: {
        password: new Types.String({
          minLength: 5,
          maxLength: 100
        }),
        confirmPassword: new Types.String({
          uses: [
            new Types.Omit(),
            new Types.Condition({
              left: Utils.ref(['password'], 1),
              right: Utils.ref([])
            })
          ]
        })
      }
    })

    const validate = compile(schema)

    t.test('omit value on return', t => {
      return validate({ password: 'hunter2', confirmPassword: 'hunter2' })
        .then(value => {
          t.deepEqual(value, { password: 'hunter2' })
        })
    })

    t.test('should error when values mismatch', t => {
      t.plan(2)

      return validate({ password: 'hunter2', confirmPassword: 'hunter3' })
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.equal(err.errors[0].type, 'Condition')
        })
    })
  })
})
