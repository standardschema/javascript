import { Any, AnyOptions } from './any'
import { allowEmpty, ValidationContext } from '../support/test'

export interface BooleanOptions extends AnyOptions {

}

export class Boolean extends Any {

  type = 'boolean'

  constructor (options: BooleanOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isBoolean))
  }

}

function isBoolean <T> (value: T, path: string[], context: ValidationContext): T {
  if (typeof value !== 'boolean') {
    throw context.error(path, 'type', 'boolean', value)
  }

  return value
}
