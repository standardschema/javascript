import test = require('blue-tape')
import { Types, assert } from '../index'

test('utils', t => {
  t.test('merge less specific type into more specific type', t => {
    const schema = new Types.Intersection({
      types: [
        new Types.String({
          minLength: 2
        }),
        new Types.Pattern({
          pattern: '^[a-z]+$'
        })
      ]
    })

    t.throws(() => assert(schema, 'HEY'))
    t.throws(() => assert(schema, '123'))
    t.doesNotThrow(() => assert(schema, 'a'))
    t.doesNotThrow(() => assert(schema, 'hey'))
    t.end()
  })
})
