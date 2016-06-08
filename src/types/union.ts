import { Any, AnyOptions } from './any'
import { Rule } from './rule'
import { promiseUnion } from '../support/promises'
import { identity, TestFn, wrapIsType } from '../utils'

export interface UnionOptions extends AnyOptions {
  types: Rule[]
}

export class Union extends Any implements UnionOptions {

  type = 'Union'
  types: Rule[]

  constructor (options: UnionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(toItemsTest(this.types))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return this.types.some(function (type) {
        return type._isType(value)
      })
    })
  }

}

/**
 * Find one item that passes the tests.
 */
function toItemsTest (types: Rule[]): TestFn<any> {
  const tests = types.map(type => type._compile())

  return function (value, path, context, next) {
    return promiseUnion(tests.map((test, index) => {
      return function () {
        return test(value, path, context, identity)
      }
    })).then(res => next(res))
  }
}
