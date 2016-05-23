import validator = require('validator')
import { String, StringOptions } from './string'
import { allowEmpty, ValidationContext } from '../support/test'

export interface EmailOptions extends StringOptions {}

export class Email extends String {

  type = 'email'

  constructor (options: EmailOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isEmail))
  }

}

function isEmail (value: string, path: string[], context: ValidationContext) {
  if (!validator.isEmail(value)) {
    throw context.error(path, 'type', 'email', value)
  }

  return value
}
