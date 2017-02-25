import { validationFunction, createValidationScope } from '../'

describe('references', () => {
  it('should be able to recursively validate schema using internal refs', () => {
    const validate = validationFunction({
      '@id': '#test',
      '@type': 'List',
      items: {
        '@type': 'Union',
        type: [
          {
            '@type': 'Number'
          },
          {
            '@id': '#test'
          }
        ]
      }
    })

    const input = [1, [2, [3], 4], 5]

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should accept external schema refs', () => {
    const scope = createValidationScope()

    validationFunction({
      '@id': '#external',
      '@type': 'Number'
    }, scope)

    const validate = validationFunction({
      '@type': 'List',
      items: {
        '@id': '#external'
      }
    }, scope)

    const input = [1, 2, 3, 4, 5]

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })

  it('should support circular references', () => {
    const scope = createValidationScope()

    validationFunction({
      '@id': '#a',
      '@type': 'Record',
      property: [
        {
          key: 'test',
          type: {
            '@id': '#b'
          }
        }
      ]
    }, scope)

    const validate = validationFunction({
      '@id': '#b',
      '@type': 'List',
      items: {
        '@type': 'Union',
        type: [
          {
            '@id': '#a'
          },
          {
            '@type': 'Number'
          }
        ]
      }
    }, scope)

    const input = [1, { test: [2] }, { test: [{ test: [3] }] }]

    return validate(input).then(function (output) {
      expect(output).toEqual(input)
    })
  })
})
