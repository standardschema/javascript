import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { skipEmpty, Context, compose } from '../utils'

export interface IntersectionOptions extends AnyOptions {
  types: Any[]
}

export class Intersection extends Any {

  type = 'intersection'
  types: Any[]

  constructor (options: IntersectionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(skipEmpty(toItemsValidation(options.types)))
  }

}

function toItemsValidation (types: Any[]) {
  const tests = types.map(type => compose(type._tests))

  return function <T> (value: T, path: string[], context: Context) {
    return promiseEvery(tests.map((test) => {
      return () => test(value, path, context)
    }))
  }
}
