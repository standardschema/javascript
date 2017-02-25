import { validationFunction } from '../'

describe('Union', () => {
  it('should validate union', () => {
    const validate = validationFunction({
      '@type': 'Union',
      type: [
        {
          '@type': 'String'
        },
        {
          '@type': 'Number'
        }
      ]
    })

    const input = 'testing'

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject invalid unions', () => {
    const validate = validationFunction({
      '@type': 'Union',
      type: [
        {
          '@type': 'String'
        },
        {
          '@type': 'Number'
        }
      ]
    })

    expect.assertions(2)

    return validate(true).catch((err) => {
      expect(err).toBeInstanceOf(Error)
      expect(err.errors).toMatchSnapshot()
    })
  })
})
