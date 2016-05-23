import { Any, AnyOptions } from './any'
import { allowEmpty, identity, TestFn, ValidationContext } from '../support/test'

export interface StringOptions extends AnyOptions {
  minLength?: number
  maxLength?: number
  pattern?: string
}

export class String extends Any {

  type = 'string'
  minLength: number
  maxLength: number
  pattern: string

  constructor (options: StringOptions = {}) {
    super(options)

    if (options.minLength != null) {
      this.minLength = options.minLength
    }

    if (options.maxLength != null) {
      this.maxLength = options.maxLength
    }

    if (options.pattern != null) {
      this.pattern = options.pattern
    }

    this._tests.push(allowEmpty(isString))
    this._tests.push(allowEmpty(toPatternTest(this.pattern)))
    this._tests.push(allowEmpty(toMinLengthTest(this.minLength)))
    this._tests.push(allowEmpty(toMaxLengthTest(this.maxLength)))
  }

}

function isString <T> (value: T, path: string[], context: ValidationContext): T {
  if (typeof value !== 'string') {
    throw context.error(path, 'type', 'string', value)
  }

  return value
}

function toMinLengthTest (minLength: number | void): TestFn<string> {
  if (minLength == null) {
    return identity
  }

  return function (value: string, path: string[], context: ValidationContext) {
    if (Buffer.byteLength(value) < minLength) {
      throw context.error(path, 'minLength', minLength, value)
    }

    return value
  }
}

function toMaxLengthTest (maxLength: number | void): TestFn<string> {
  if (maxLength == null) {
    return identity
  }

  return function (value: string, path: string[], context: ValidationContext) {
    if (Buffer.byteLength(value) > maxLength) {
      throw context.error(path, 'maxLength', maxLength, value)
    }

    return value
  }
}

function toPatternTest (pattern: string): TestFn<string> {
  if (pattern == null) {
    return identity
  }

  const re = new RegExp(pattern)

  return function (value: string, path: string[], context: ValidationContext) {
    if (!re.test(value)) {
      throw context.error(path, 'pattern', pattern, value)
    }

    return value
  }
}
