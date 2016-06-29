import { Any, AnyOptions } from './any'
import { Rule } from './rule'
import { TestFn, wrapIsType, Context, isType } from '../utils'

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

  _extend (options: UnionOptions): UnionOptions {
    const res = super._extend(options) as UnionOptions

    if (options.types) {
      res.types = this.types.concat(options.types)
    }

    return res
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      let res = 0

      for (const type of this.types) {
        const check = isType(type, value, path, context)

        if (check > res) {
          res = check
        }
      }

      if (res === 0) {
        throw context.error(path, 'Union', 'types', this.types, value)
      }

      return res
    })
  }

  toJSON () {
    const json = super.toJSON()
    json.types = this.types.map(x => x.toJSON())
    return json
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
      const check = isType(types[i], value, path, context)

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
