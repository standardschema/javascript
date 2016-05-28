import validator = require('validator')
import { String, StringOptions } from './string'
import { skipEmpty, Context } from '../utils'

export interface EmailOptions extends StringOptions {}

export class Email extends String {

  type = 'email'

  constructor (options: EmailOptions = {}) {
    super(options)

    this._tests.push(skipEmpty(isEmail))
  }

}

function isEmail (value: string, path: string[], context: Context) {
  if (!validator.isEmail(value)) {
    throw context.error(path, 'type', 'email', value)
  }

  return value
}
