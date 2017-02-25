import { validationFunction } from '../'

describe('String', () => {
  it('should validate strings', () => {
    const validate = validationFunction({
      '@type': 'String'
    })

    const input = 'testing'

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should support formats', () => {
    const validate = validationFunction({
      '@type': 'String',
      format: 'uri'
    })

    const input = 'http://example.com'

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-strings', () => {
    const validate = validationFunction({
      '@type': 'String'
    })

    expect.assertions(1)

    return validate(10).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
