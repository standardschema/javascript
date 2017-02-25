import { validationFunction } from '../'

describe('Eval', () => {
  it('should be able to use eval rule', () => {
    const validate = validationFunction({
      '@type': 'Eval',
      value: '10 + 10'
    })

    return validate(undefined).then(function (output) {
      expect(output).toEqual(20)
    })
  })

  it('should act as a "default" value', () => {
    const validate = validationFunction({
      '@type': 'Union',
      type: [
        {
          '@type': 'Number'
        },
        {
          '@type': 'Eval',
          value: 10
        }
      ]
    })

    return Promise.all([validate(101), validate('test'), validate(undefined)]).then(function (output) {
      expect(output).toEqual([101, 10, 10])
    })
  })
})
