import { validationFunction } from '../'

describe('Constant', () => {
  it('should always return the constant value', () => {
    const validate = validationFunction({
      '@type': 'Constant',
      value: 'hello world'
    })

    return validate(undefined).then(function (output) {
      expect(output).toEqual('hello world')
    })
  })
})
