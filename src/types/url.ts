import validator = require('validator')
import { String, StringOptions } from './string'
import { Context, NextFunction, wrapIsType } from '../utils'

export interface UrlOptions extends StringOptions {}

export class Url extends String implements UrlOptions {

  type = 'Url'

  constructor (options: UrlOptions = {}) {
    super(options)

    this._tests.push(isUrl)
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return validator.isURL(value)
    })
  }

}

function isUrl (value: string, path: string[], context: Context, next: NextFunction<string>) {
  if (!validator.isURL(value)) {
    throw context.error(path, 'Url', 'type', 'Url', value)
  }

  return next(value)
}
