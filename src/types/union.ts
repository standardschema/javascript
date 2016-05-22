import { Any } from './any'
import { promiseAny } from '../support/promises'
import { allowEmpty, ValidationContext, wrap } from '../support/test'

export interface UnionOptions {
  types: Any[]
}

export class Union extends Any {

  type = 'union'
  types: Any[]

  constructor (options: UnionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(allowEmpty(toItemsTest(this.types)))
  }

}

/**
 * Find one item that passes the tests.
 */
function toItemsTest (types: Any[]) {
  return function <T> (value: T, path: string[], context: ValidationContext) {
    return promiseAny(types.map((type) => {
      return () => wrap(type)(value, path, context)
    }))
  }
}
