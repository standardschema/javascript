import extend = require('xtend')
import { Any, AnyOptions } from './any'
import { Rule } from './rule'
import { promiseEvery } from '../support/promises'
import { TestFn, identity, wrapIsType } from '../utils'

export interface IntersectionOptions extends AnyOptions {
  types: Rule[]
}

export class Intersection extends Any implements IntersectionOptions {

  type = 'Intersection'
  types: Rule[]

  constructor (options: IntersectionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(toIntersectionTest(this.types))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      let res = 0

      for (const type of this.types) {
        const check = type._isType(value)

        if (check === 0) {
          return 0
        }

        res += check
      }

      return res
    })
  }

}

/**
 * Run all validation types.
 *
 * TODO: Make this merge types in the intersection, instead of values.
 */
function toIntersectionTest (types: Rule[]): TestFn<any> {
  const tests = types.map(type => type._compile())

  return function (value, path, context, next) {
    const result = promiseEvery(tests.map((test) => {
      return function () {
        return test(value, path, context, identity)
      }
    }))

    return result.then(merge).then(res => next(res))
  }
}

/**
 * Merge an array of values.
 */
function merge (values: any[]) {
  let out = values[0]

  for (let i = 1; i < values.length; i++) {
    if (typeof values[i] === 'object') {
      out = extend(out, values[i])
    } else {
      out = values[i]
    }
  }

  return out
}
