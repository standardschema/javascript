import validator = require('validator')
import { String, StringOptions } from './string'
import { allowEmpty, ValidationContext } from '../support/test'

export interface UriOptions extends StringOptions {}

export class Uri extends String {

  type = 'uri'

  constructor (options: UriOptions = {}) {
    super(options)

    this._tests.push(allowEmpty(isUri))
  }

}

function isUri (value: string, path: string[], context: ValidationContext) {
  if (!validator.isURL(value)) {
    throw context.error(path, 'type', 'uri', value)
  }

  return value
}
