import { validationFunction } from '../'

describe('Tuple', () => {
  it('should validate tuples', () => {
    const validate = validationFunction({
      '@type': 'Tuple',
      tuple: [
        {
          '@type': 'String'
        },
        {
          '@type': 'Boolean'
        }
      ]
    })

    const input = ['testing', true]

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-tuples', () => {
    const validate = validationFunction({
      '@type': 'Tuple',
      tuple: [
        {
          '@type': 'String'
        },
        {
          '@type': 'Boolean'
        }
      ]
    })

    expect.assertions(1)

    return validate(true).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })

  it('should reject incorrect tuples', () => {
    const validate = validationFunction({
      '@type': 'Tuple',
      tuple: [
        {
          '@type': 'String'
        },
        {
          '@type': 'Boolean'
        }
      ]
    })

    expect.assertions(1)

    return validate([1, 2]).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
