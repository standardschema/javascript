import { validationFunction } from '../'

describe('DateTime', () => {
  it('should validate date times', () => {
    const validate = validationFunction({
      '@type': 'DateTime'
    })

    const input = new Date()

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should reject non-date times', () => {
    const validate = validationFunction({
      '@type': 'DateTime'
    })

    expect.assertions(1)

    return validate(true).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })

  it('should be possible to specify min date', () => {
    const validate = validationFunction({
      '@type': 'DateTime',
      min: '2020-01-01'
    })

    return validate(new Date('2016-01-01')).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })

  it('should be possible to specify max date', () => {
    const validate = validationFunction({
      '@type': 'DateTime',
      max: '2020-01-01'
    })

    return validate(new Date('2025-01-01')).catch(function (err) {
      expect(err.errors).toMatchSnapshot()
    })
  })
})
