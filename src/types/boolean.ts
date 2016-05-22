import { Any, AnyOptions } from './any'
import { ValidationError } from '../support/error'
import { allowEmpty } from '../support/test'

export interface BooleanOptions extends AnyOptions {

}

export class Boolean extends Any {

  type = 'boolean'

  constructor (options: BooleanOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isBoolean))
  }

}

function isBoolean <T> (value: T, path: string[]): T {
  if (typeof value !== 'boolean') {
    throw new ValidationError(path, 'type', 'boolean', value)
  }

  return value
}
