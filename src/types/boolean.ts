import { Any, AnyOptions } from './any'
import { Context, NextFunction, wrapIsType } from '../utils'

export interface BooleanOptions extends AnyOptions {

}

export class Boolean extends Any implements BooleanOptions {

  type = 'Boolean'

  constructor (options: BooleanOptions = {}) {
    super(options)

    this._tests.push(isBoolean)
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return typeof value === 'boolean'
    })
  }

}

/**
 * Run a boolean value check.
 */
function isBoolean (value: any, path: string[], context: Context, next: NextFunction<any>) {
  if (typeof value !== 'boolean') {
    throw context.error(path, 'Boolean', 'type', 'Boolean', value)
  }

  return next(value)
}
