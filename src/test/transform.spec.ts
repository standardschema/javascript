import test = require('blue-tape')
import { Types, compile } from '../index'

test('transform', t => {
  t.test('uses', t => {
    const schema = new Types.String({
      uses: [
        new Types.Transform({
          name: 'toLower',
          transform: (str: string) => str.toLowerCase()
        })
      ]
    })

    const validate = compile(schema)

    t.test('should validate with transformation', t => {
      return validate('HEY')
        .then(value => {
          t.equal(value, 'hey')
        })
    })
  })
})
