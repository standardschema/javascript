import validator = require('validator')
import { String, StringOptions } from './string'
import { skipEmpty, Context } from '../utils'

export interface UuidOptions extends StringOptions {
  version?: number
}

export class Uuid extends String {

  type = 'Uuid'
  version: number

  constructor (options: UuidOptions = {}) {
    super(options)

    if (options.version != null) {
      this.version = options.version
    }

    this._tests.push(skipEmpty(toUuidTest(this.version)))
  }

  _isType (value: any) {
    return validator.isUUID(value)
  }

}

function toUuidTest (version?: number) {
  return function (value: string, path: string[], context: Context) {
    if (!validator.isUUID(value, version)) {
      throw context.error(path, 'type', 'Uuid', value)
    }

    return value
  }
}
