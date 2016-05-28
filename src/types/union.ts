import { Any } from './any'
import { promiseAny } from '../support/promises'
import { skipEmpty, Context, compose } from '../utils'

export interface UnionOptions {
  types: Any[]
}

export class Union extends Any {

  type = 'union'
  types: Any[]

  constructor (options: UnionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(skipEmpty(toItemsTest(this.types)))
  }

}

/**
 * Find one item that passes the tests.
 */
function toItemsTest (types: Any[]) {
  const tests = types.map(type => compose(type._tests))

  return function <T> (value: T, path: string[], context: Context) {
    return promiseAny(tests.map((test) => {
      return () => test(value, path, context)
    }))
  }
}
