import validator = require('validator')
import { String, StringOptions } from './string'
import { ValidationError } from '../support/error'
import { allowEmpty } from '../support/test'

export interface EmailOptions extends StringOptions {}

export class Email extends String {

  type = 'email'

  constructor (options: EmailOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isEmail))
  }

}

function isEmail (value: string, path: string[]) {
  if (!validator.isEmail(value)) {
    throw new ValidationError(path, 'type', 'email', value)
  }

  return value
}
