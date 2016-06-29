import validator = require('validator')
import { String, StringOptions } from './string'
import { TestFn, wrapIsType, Context } from '../utils'

export interface UuidOptions extends StringOptions {
  version?: number
}

export class Uuid extends String implements UuidOptions {

  type = 'Uuid'
  version: number

  constructor (options: UuidOptions = {}) {
    super(options)

    if (options.version != null) {
      this.version = options.version
    }

    this._tests.push(toUuidTest(this.version))
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (validator.isUUID(value, this.version)) {
        return 1
      }

      throw context.error(path, 'Uuid', 'type', 'Uuid', value)
    })
  }

  _extend (options: UuidOptions): UuidOptions {
    return super._extend(options) as UuidOptions
  }

}

function toUuidTest (version?: number): TestFn<string> {
  return function (value, path, context, next) {
    if (!validator.isUUID(value, version)) {
      throw context.error(path, 'Uuid', 'type', 'Uuid', value)
    }

    return next(value)
  }
}
