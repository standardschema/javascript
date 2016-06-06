import test = require('blue-tape')
import { Types, compile } from '../index'

test('mutate', t => {
  t.test('uses', t => {
    const schema = new Types.String({
      uses: [
        new Types.Mutate({
          name: 'toLower',
          mutate: (str: string) => str.toLowerCase()
        }),
        new Types.Whitelist({
          whitelist: ['hey']
        })
      ]
    })

    const validate = compile(schema)

    t.test('should validate with mutation', t => {
      return validate('HEY')
        .then(value => {
          t.equal(value, 'HEY')
        })
    })

    t.test('should fail with non-whitelisted lower string', t => {
      t.plan(2)

      return validate('invalid')
        .catch(function (err) {
          t.equal(err.errors.length, 1)
          t.deepEqual(err.errors[0].keyword, 'whitelist')
        })
    })
  })
})
