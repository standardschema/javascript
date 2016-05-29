import assert = require('assert')
import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { skipEmpty, Context, compose } from '../utils'

export interface TupleOptions extends AnyOptions {
  tuple: Any[]
}

export class Tuple extends Any {

  type = 'Tuple'
  tuple: Any[]

  constructor (options: TupleOptions) {
    super(options)

    assert.ok(Array.isArray(options.tuple), 'Expected "tuple" to be a list of types')

    this.tuple = options.tuple

    this._tests.push(skipEmpty(toTupleTest(options.tuple)))
  }

}

function toTupleTest (tuple: Any[]) {
  const tests = tuple.map(type => compose(type._tests))

  return function <T> (values: T[], path: string[], context: Context) {
    return promiseEvery(tests.map(function (test, index) {
      return function () {
        const value = values[index]
        const valuePath = path.concat(String(index))

        return test(value, valuePath, context).then(() => value)
      }
    }))
  }
}
