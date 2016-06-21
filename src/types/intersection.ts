import omit = require('object.omit')
import { Any, AnyOptions } from './any'
import { Rule } from './rule'
import { promiseEvery } from '../support/promises'
import { TestFn, identity, wrapIsType, mergeSchema, merge } from '../utils'

export interface IntersectionOptions extends AnyOptions {
  types: Rule[]
}

export class Intersection extends Any implements IntersectionOptions {

  type = 'Intersection'
  types: Rule[]
  _types: Rule[]

  constructor (options: IntersectionOptions) {
    super(options)

    this.types = options.types
    this._types = squashTypes(this.types)

    this._tests.push(toIntersectionTest(this._types))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      let res = 0

      for (const type of this._types) {
        const check = type._isType(value)

        if (check === 0) {
          return 0
        }

        res += check
      }

      return res
    })
  }

  toJSON () {
    return omit(this, ['_tests', '_types'])
  }

}

/**
 * Run all validation types.
 */
function toIntersectionTest (types: Rule[]): TestFn<any> {
  const tests = types.map(type => type._compile())

  return function (value, path, context, next) {
    const result = promiseEvery(tests.map((test) => {
      return function () {
        return test(value, path, context, identity)
          .then(result => {
            // Merge each result with the original value for subsequent tests.
            value = merge(value, result)

            return result
          })
      }
    }))

    return result.then(values => merge(...values)).then(res => next(res))
  }
}

/**
 * Optimise the shape of types.
 */
function squashTypes (types: Rule[]): Rule[] {
  return types
    .reduce(
      function (out, type) {
        for (let i = 0; i < out.length; i++) {
          const res = out[i]

          if (res._typeOf(type)) {
            out[i] = mergeSchema(res, type)
            return out
          }

          if (type._typeOf(res)) {
            out[i] = mergeSchema(type, res)
            return out
          }
        }

        out.push(type)

        return out
      },
      [] as Rule[]
    )
}
