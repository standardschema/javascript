import validator = require('validator')
import { String, StringOptions } from './string'
import { skipEmpty, Context } from '../utils'

export interface UriOptions extends StringOptions {}

export class Uri extends String {

  type = 'Uri'

  constructor (options: UriOptions = {}) {
    super(options)

    this._tests.push(skipEmpty(isUri))
  }

}

function isUri (value: string, path: string[], context: Context) {
  if (!validator.isURL(value)) {
    throw context.error(path, 'type', 'uri', value)
  }

  return value
}
