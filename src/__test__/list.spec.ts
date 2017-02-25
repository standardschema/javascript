import { validationFunction } from '../'

describe('List', () => {
  it('should validate lists', () => {
    const validate = validationFunction({
      '@type': 'List',
      items: {
        '@type': 'String'
      }
    })

    const input = ['a', 'b', 'c']

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-lists', () => {
    const validate = validationFunction({
      '@type': 'List',
      items: {
        '@type': 'String'
      }
    })

    expect.assertions(1)

    return validate([1, 2, 3]).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
