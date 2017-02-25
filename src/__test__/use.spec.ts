import { validationFunction } from '../'

describe('#use', () => {
  it('should validate using use property', () => {
    const validate = validationFunction({
      '@type': 'String',
      use: [
        {
          '@type': 'String',
          minLength: 2
        },
        {
          '@type': 'String',
          minLength: 4
        }
      ]
    })

    const input = 'testing'

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject invalid use schemas', () => {
    const validate = validationFunction({
      '@type': 'String',
      use: [
        {
          '@type': 'String',
          minLength: 10
        }
      ]
    })

    const input = 'testing'

    expect.assertions(1)

    return validate(input).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
