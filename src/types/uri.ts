import validator = require('validator')
import { String, StringOptions } from './string'
import { skipEmpty, Context } from '../utils'

export interface UriOptions extends StringOptions {}

export class Uri extends String implements UriOptions {

  type = 'Uri'

  constructor (options: UriOptions = {}) {
    super(options)

    this._tests.push(skipEmpty(isUri))
  }

  _isType (value: any) {
    return validator.isURL(value)
  }

}

function isUri (value: string, path: string[], context: Context) {
  if (!validator.isURL(value)) {
    throw context.error(path, 'type', 'Uri', value)
  }

  return value
}
