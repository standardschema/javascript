import assert = require('assert')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { TestFn, identity, wrapIsType } from '../utils'

export interface TupleOptions extends AnyOptions {
  tuple: Rule[]
}

export class Tuple extends Any implements TupleOptions {

  type = 'Tuple'
  tuple: Rule[]

  constructor (options: TupleOptions) {
    super(options)

    assert.ok(Array.isArray(options.tuple), 'Expected "tuple" to be a list of types')

    this.tuple = options.tuple

    this._tests.push(toTupleTest(options.tuple))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return value.length === this.tuple.length
    })
  }

}

function toTupleTest (tuple: Rule[]): TestFn<any[]> {
  const tests = tuple.map(type => type._compile())

  return function (values, path, context, next) {
    return promiseEvery(tests.map(function (test, index) {
      return function () {
        const value = values[index]
        const valuePath = path.concat(String(index))

        return test(value, valuePath, context, identity)
      }
    })).then(res => next(res))
  }
}
