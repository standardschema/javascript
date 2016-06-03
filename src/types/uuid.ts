import validator = require('validator')
import { String, StringOptions } from './string'
import { TestFn } from '../utils'

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

  _isType (value: any) {
    return validator.isUUID(value)
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
