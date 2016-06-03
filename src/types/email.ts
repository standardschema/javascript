import validator = require('validator')
import { String, StringOptions } from './string'
import { Context, NextFunction } from '../utils'

export interface EmailOptions extends StringOptions {}

export class Email extends String implements EmailOptions {

  type = 'Email'

  constructor (options: EmailOptions = {}) {
    super(options)

    this._tests.push(isEmail)
  }

}

function isEmail (value: string, path: string[], context: Context, next: NextFunction<any>) {
  if (!validator.isEmail(value)) {
    throw context.error(path, 'Email', 'type', 'Email', value)
  }

  return next(value)
}
