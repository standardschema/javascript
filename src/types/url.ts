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

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (validator.isURL(value)) {
        return 1
      }

      throw context.error(path, 'Url', 'type', 'Url', value)
    })
  }

  _extend (options: UrlOptions): UrlOptions {
    return super._extend(options) as UrlOptions
  }

}

function isUrl (value: string, path: string[], context: Context, next: NextFunction<string>) {
  if (!validator.isURL(value)) {
    throw context.error(path, 'Url', 'type', 'Url', value)
  }

  return next(value)
}
