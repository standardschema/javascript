import assert = require('assert')
import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { allowEmpty, ValidationContext, wrap } from '../support/test'

export interface TupleOptions extends AnyOptions {
  tuple: Any[]
}

export class Tuple extends Any {

  type = 'tuple'
  tuple: Any[]

  constructor (options: TupleOptions) {
    super(options)

    assert.ok(Array.isArray(options.tuple), 'Expected "items" to be an array of types')

    this.tuple = options.tuple

    this._tests.push(allowEmpty(toTupleTest(options.tuple)))
  }

}

function toTupleTest (tuple: Any[]) {
  const tests = tuple.map(type => wrap(type))

  return function <T> (values: T[], path: string[], context: ValidationContext) {
    return promiseEvery(tests.map(function (test, index) {
      return function () {
        const value = values[index]
        const valuePath = path.concat(String(index))

        return test(value, valuePath, context).then(() => value)
      }
    }))
  }
}