import { Any, AnyOptions } from './any'
import { Context, NextFunction, wrapIsType } from '../utils'

const _toString = Object.prototype.toString

export interface DateTimeOptions extends AnyOptions {}

export class DateTime extends Any implements DateTimeOptions {

  type = 'DateTime'

  constructor (options: DateTimeOptions = {}) {
    super(options)

    this._tests.push(isDate)
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (_toString.call(value) === '[object Date]') {
        return 1
      }

      throw context.error(path, 'Date', 'type', 'Date', value)
    })
  }

  _extend (options: DateTimeOptions): DateTimeOptions {
    return super._extend(options) as DateTimeOptions
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
