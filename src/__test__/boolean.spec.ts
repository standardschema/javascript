import { validationFunction } from '../'

describe('Boolean', () => {
  it('should validate booleans', () => {
    const validate = validationFunction({
      '@type': 'Boolean'
    })

    const input = true

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-booleans', () => {
    const validate = validationFunction({
      '@type': 'Boolean'
    })

    expect.assertions(1)

    return validate(10).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
