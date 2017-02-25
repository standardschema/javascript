import { validationFunction } from '../'

describe('Number', () => {
  it('should validate numbers', () => {
    const validate = validationFunction({
      '@type': 'Number'
    })

    const input = 101

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-numbers', () => {
    const validate = validationFunction({
      '@type': 'Number'
    })

    expect.assertions(1)

    return validate(true).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
