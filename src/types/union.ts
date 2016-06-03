import { Rule } from './rule'
import { promiseAny } from '../support/promises'
import { compose, identity, TestFn } from '../utils'

export interface UnionOptions {
  types: Rule[]
}

export class Union extends Rule implements UnionOptions {

  type = 'Union'
  types: Rule[]

  constructor (options: UnionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(toItemsTest(this.types))
  }

  _isType (value: any) {
    return this.types.some(function (type) {
      return type._isType(value)
    })
  }

}

/**
 * Find one item that passes the tests.
 */
function toItemsTest (types: Rule[]): TestFn<any> {
  const tests = types.map(type => compose(type._tests))

  return function (value, path, context, next) {
    return promiseAny(tests.map((test) => {
      return () => test(value, path, context, identity)
    })).then(res => next(res))
  }
}
