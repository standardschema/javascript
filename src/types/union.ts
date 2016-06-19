import { Any, AnyOptions } from './any'
import { Rule } from './rule'
import { TestFn, wrapIsType } from '../utils'

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
      let res = 0

      for (const type of this.types) {
        const check = type._isType(value)

        if (check > res) {
          res = check
        }
      }

      return res
    })
  }

}

/**
 * Find one item that passes the tests.
 */
function toItemsTest (types: Rule[]): TestFn<any> {
  const tests = types.map(type => type._compile())

  return function (value, path, context, next) {
    let res = 0
    let test: TestFn<any>

    for (let i = 0; i < tests.length; i++) {
      const check = types[i]._isType(value)

      if (check > res) {
        res = check
        test = tests[i]
      }
    }

    if (res === 0) {
      throw context.error(path, 'Union', 'types', types, value)
    }

    return test(value, path, context, next)
  }
}
