import { validationFunction } from '../'

describe('Literal', () => {
  it('should validate literals', () => {
    const validate = validationFunction({
      '@type': 'Literal',
      value: 'test'
    })

    const input = 'test'

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-literals', () => {
    const validate = validationFunction({
      '@type': 'Literal',
      value: 'test'
    })

    expect.assertions(1)

    return validate(10).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
