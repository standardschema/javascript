import { validationFunction } from '../'

describe('Record', () => {
  it('should validate a record', () => {
    const validate = validationFunction({
      '@type': 'Record',
      property: [
        {
          '@type': 'Property',
          key: 'a',
          type: {
            '@type': 'String'
          }
        },
        {
          '@type': 'Property',
          key: 'b',
          type: {
            '@type': 'Number'
          }
        }
      ]
    })

    const input = { a: 'test', b: 10 }

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('it should support dynamic record keys', () => {
    const validate = validationFunction({
      '@type': 'Record',
      property: [
        {
          '@type': 'Property',
          key: {
            '@type': 'String'
          },
          type: {
            '@type': 'String'
          }
        }
      ]
    })

    const input = { a: 'a', b: 'b' }

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('it should support additional properties', () => {
    const validate = validationFunction({
      '@type': 'Record',
      additionalProperties: {
        '@type': 'Any'
      }
    })

    const input = { a: 'a', b: 'b' }

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject records with missing properties', () => {
    const validate = validationFunction({
      '@type': 'Record',
      property: [
        {
          '@type': 'Property',
          key: 'a',
          type: {
            '@type': 'String'
          }
        },
        {
          '@type': 'Property',
          key: 'b',
          type: {
            '@type': 'Number'
          }
        }
      ]
    })

    expect.assertions(1)

    return validate({ a: 'test' }).catch((err) => {
      expect(err.errors).toMatchSnapshot()
    })
  })

  it('should reject invalid dynamic keys', () => {
    const validate = validationFunction({
      '@type': 'Record',
      property: [
        {
          '@type': 'Property',
          key: {
            '@type': 'String',
            minLength: 10
          },
          type: {
            '@type': 'String'
          },
          minProperties: 1
        }
      ]
    })

    expect.assertions(1)

    return validate({ a: 10 }).catch((err) => {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
