import validator = require('validator')
import { String, StringOptions } from './string'
import { ValidationError } from '../support/error'
import { allowEmpty } from '../support/test'

export interface UriOptions extends StringOptions {}

export class Uri extends String {

  type = 'uri'

  constructor (options: UriOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isUri))
  }

}

function isUri (value: string, path: string[]) {
  if (!validator.isURL(value)) {
    throw new ValidationError(path, 'type', 'uri', value)
  }

  return value
}
