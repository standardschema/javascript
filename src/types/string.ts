import { Any, AnyOptions } from './any'
import { ValidationError } from '../support/error'
import { allowEmpty, identity, TestFn } from '../support/test'

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

function isString <T> (value: T, path: string[]): T {
  if (typeof value !== 'string') {
    throw new ValidationError(path, 'type', 'string', value)
  }

  return value
}

function toMinLengthTest (minLength: number | void): TestFn<string> {
  if (minLength == null) {
    return identity
  }

  return function (value: string, path: string[]) {
    if (Buffer.byteLength(value) < minLength) {
      throw new ValidationError(path, 'minLength', minLength, value)
    }

    return value
  }
}

function toMaxLengthTest (maxLength: number | void): TestFn<string> {
  if (maxLength == null) {
    return identity
  }

  return function (value: string, path: string[]) {
    if (Buffer.byteLength(value) > maxLength) {
      throw new ValidationError(path, 'maxLength', maxLength, value)
    }

    return value
  }
}

function toPatternTest (pattern: string): TestFn<string> {
  if (pattern == null) {
    return identity
  }

  const re = new RegExp(pattern)

  return function (value: string, path: string[]) {
    if (!re.test(value)) {
      throw new ValidationError(path, 'pattern', pattern, value)
    }

    return value
  }
}
