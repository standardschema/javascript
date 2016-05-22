import { Any, AnyOptions } from './any'
import { ValidationError } from '../support/error'
import { allowEmpty } from '../support/test'

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

function isDate (value: any, path: string[]): Date {
  if (_toString.call(value) !== '[object Date]') {
    throw new ValidationError(path, 'type', 'date', value)
  }

  if (isNaN(value.getTime())) {
    throw new ValidationError(path, 'type', 'date', value)
  }

  return value
}
