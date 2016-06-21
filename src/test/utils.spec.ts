import test = require('blue-tape')
import { Types } from '../index'

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

    t.equal(schema._isType('HEY'), 0)
    t.equal(schema._isType('123'), 0)
    t.equal(schema._isType('a'), 4)
    t.equal(schema._isType('hey'), 4)
    t.end()
  })
})
