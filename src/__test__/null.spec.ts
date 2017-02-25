import { validationFunction } from '../'

describe('Null', () => {
  it('should validate nulls', () => {
    const validate = validationFunction({
      '@type': 'Null'
    })

    const input = null

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-nulls', () => {
    const validate = validationFunction({
      '@type': 'Null'
    })

    expect.assertions(1)

    return validate(10).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
