import extend = require('xtend')
import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { skipEmpty, Context, compose } from '../utils'

export interface IntersectionOptions extends AnyOptions {
  types: Any[]
}

export class Intersection extends Any {

  type = 'Intersection'
  types: Any[]

  constructor (options: IntersectionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(skipEmpty(toItemsValidation(this.types)))
  }

  _isType (value: any) {
    return this.types.every(function (type) {
      return type._isType(value)
    })
  }

}

/**
 * Run all validation types.
 *
 * TODO: Make this merge types in the intersection, instead of values.
 */
function toItemsValidation (types: Any[]) {
  const tests = types.map(type => compose(type._tests))

  return function <T> (value: T, path: string[], context: Context) {
    const result = promiseEvery(tests.map((test) => {
      return () => test(value, path, context)
    }))

    return result.then(merge)
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
