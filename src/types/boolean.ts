import { Any, AnyOptions } from './any'
import { skipEmpty, Context } from '../utils'

export interface BooleanOptions extends AnyOptions {

}

export class Boolean extends Any {

  type = 'Boolean'

  constructor (options: BooleanOptions = {}) {
    super(options)

    this._tests.push(skipEmpty(isBoolean))
  }

  _isType (value: any) {
    return typeof value === 'boolean'
  }

}

/**
 * Run a boolean value check.
 */
function isBoolean <T> (value: T, path: string[], context: Context): T {
  if (typeof value !== 'boolean') {
    throw context.error(path, 'type', 'Boolean', value)
  }

  return value
}
