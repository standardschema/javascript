import { validationFunction } from '../'

describe('Any', () => {
  it('should validate anything', () => {
    const validate = validationFunction({
      '@type': 'Any'
    })

    const input = true

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })
})
