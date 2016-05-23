import { Any, AnyOptions } from './any'
import { allowEmpty, ValidationContext } from '../support/test'

const _toString = Object.prototype.toString

export interface DateOptions extends AnyOptions {

}

export class Date extends Any {

  type = 'date'

  constructor (options: DateOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isDate))
  }

}

function isDate (value: any, path: string[], context: ValidationContext): Date {
  if (_toString.call(value) !== '[object Date]') {
    throw context.error(path, 'type', 'date', value)
  }

  if (isNaN(value.getTime())) {
    throw context.error(path, 'type', 'date', value)
  }

  return value
}
