import { Any, AnyOptions } from './any'
import { allowEmpty, ValidationContext, wrap } from '../support/test'
import { promiseEvery } from '../support/promises'

export interface IntersectionOptions extends AnyOptions {
  types: Any[]
}

export class Intersection extends Any {

  type = 'intersection'
  types: Any[]

  constructor (options: IntersectionOptions) {
    super(options)

    this.types = options.types

    this._tests.push(allowEmpty(toItemsValidation(options.types)))
  }

}

function toItemsValidation (types: Any[]) {
  return function <T> (value: T, path: string[], context: ValidationContext) {
    return promiseEvery(types.map((validation) => {
      return () => wrap(validation)(value, path, context)
    }))
  }
}
