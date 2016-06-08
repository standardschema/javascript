import { Any, AnyOptions } from './any'
import { Context, NextFunction, wrapIsType } from '../utils'

const _toString = Object.prototype.toString

export interface DateOptions extends AnyOptions {

}

export class Date extends Any implements DateOptions {

  type = 'Date'

  constructor (options: DateOptions = {}) {
    super(options)

    this._tests.push(isDate)
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return _toString.call(value) === '[object Date]'
    })
  }

}

function isDate (value: any, path: string[], context: Context, next: NextFunction<any>) {
  if (_toString.call(value) !== '[object Date]') {
    throw context.error(path, 'Date', 'type', 'Date', value)
  }

  if (isNaN(value.getTime())) {
    throw context.error(path, 'Date', 'type', 'Date', value)
  }

  return next(value)
}
