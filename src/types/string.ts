import { Any, AnyOptions } from './any'
import { toNext, TestFn, Context, NextFunction } from '../utils'

export interface StringOptions extends AnyOptions {
  minLength?: number
  maxLength?: number
  pattern?: string
}

export class String extends Any implements StringOptions {

  type = 'String'
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

    this._tests.push(isString)
    this._tests.push(toPatternTest(this.pattern))
    this._tests.push(toMinLengthTest(this.minLength))
    this._tests.push(toMaxLengthTest(this.maxLength))
  }

  _isType (value: any) {
    return typeof value === 'string'
  }

}

function isString <T> (value: T, path: string[], context: Context, next: NextFunction<T>) {
  if (typeof value !== 'string') {
    throw context.error(path, 'String', 'type', 'String', value)
  }

  return next(value)
}

function toMinLengthTest (minLength: number | void): TestFn<string> {
  if (minLength == null) {
    return toNext
  }

  return function (value, path, context, next) {
    if (Buffer.byteLength(value) < minLength) {
      throw context.error(path, 'String', 'minLength', minLength, value)
    }

    return next(value)
  }
}

function toMaxLengthTest (maxLength: number | void): TestFn<string> {
  if (maxLength == null) {
    return toNext
  }

  return function (value, path, context, next) {
    if (Buffer.byteLength(value) > maxLength) {
      throw context.error(path, 'String', 'maxLength', maxLength, value)
    }

    return next(value)
  }
}

function toPatternTest (pattern: string): TestFn<string> {
  if (pattern == null) {
    return toNext
  }

  const re = new RegExp(pattern)

  return function (value, path, context, next) {
    if (!re.test(value)) {
      throw context.error(path, 'String', 'pattern', pattern, value)
    }

    return next(value)
  }
}
