import validator = require('validator')
import { String, StringOptions } from './string'
import { Context, NextFunction, wrapIsType } from '../utils'

export interface EmailOptions extends StringOptions {}

export class Email extends String implements EmailOptions {

  type = 'Email'

  constructor (options: EmailOptions = {}) {
    super(options)

    this._tests.push(isEmail)
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (validator.isEmail(value)) {
        return 1
      }

      throw context.error(path, 'Email', 'type', 'Email', value)
    })
  }

  _extend (options: EmailOptions): EmailOptions {
    return super._extend(options) as EmailOptions
  }

}

function isEmail (value: string, path: string[], context: Context, next: NextFunction<any>) {
  if (!validator.isEmail(value)) {
    throw context.error(path, 'Email', 'type', 'Email', value)
  }

  return next(value)
}
