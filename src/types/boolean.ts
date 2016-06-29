import { Any, AnyOptions } from './any'
import { Context, NextFunction, wrapIsType } from '../utils'

export interface BooleanOptions extends AnyOptions {}

export class Boolean extends Any implements BooleanOptions {

  type = 'Boolean'

  constructor (options: BooleanOptions = {}) {
    super(options)

    this._tests.push(isBoolean)
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (typeof value === 'boolean') {
        return 1
      }

      throw context.error(path, 'Boolean', 'type', 'Boolean', value)
    })
  }

  _extend (options: BooleanOptions): BooleanOptions {
    return super._extend(options)
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
