import test = require('blue-tape')
import { Types, compile } from '../index'

test('string', t => {
  t.test('uses', t => {
    const schema = new Types.String({
      minLength: 10,
      uses: [
        new Types.Test({
          name: 'fail',
          test: () => false
        })
      ]
    })

    const validate = compile(schema)

    t.test('should fail with `minLength` before `uses`', t => {
      t.plan(2)

      return validate('hey')
        .catch(err => {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'minLength')
        })
    })

    t.test('should fail with uses after validation of type', t => {
      t.plan(2)

      return validate('a longer string to pass validation')
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'test')
        })
    })
  })
})