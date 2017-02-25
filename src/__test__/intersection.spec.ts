import { validationFunction } from '../'

describe('Intersection', () => {
  it('should work with intersection types', () => {
    const validate = validationFunction({
      '@type': 'Intersection',
      type: [
        {
          '@type': 'String',
          minLength: 5
        },
        {
          '@type': 'String',
          maxLength: 10
        }
      ]
    })

    const input = 'testing'

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject invalid intersection values', () => {
    const validate = validationFunction({
      '@type': 'Intersection',
      type: [
        {
          '@type': 'String',
          minLength: 5
        },
        {
          '@type': 'String',
          maxLength: 10
        }
      ]
    })

    expect.assertions(1)

    return validate('hey').catch((err) => {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
