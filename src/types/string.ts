import { Any, AnyOptions } from './any'
import { toNext, TestFn, Context, NextFunction, Ref, toValue, wrapIsType } from '../utils'

export interface StringOptions extends AnyOptions {
  minLength?: number | Ref
  maxLength?: number | Ref
  pattern?: string | Ref
}

export class String extends Any implements StringOptions {

  type = 'String'
  minLength: number | Ref
  maxLength: number | Ref
  pattern: string | Ref

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
    return wrapIsType(this, value, super._isType, (value) => {
      return typeof value === 'string'
    })
  }

}

function isString <T> (value: T, path: string[], context: Context, next: NextFunction<T>) {
  if (typeof value !== 'string') {
    throw context.error(path, 'String', 'type', 'String', value)
  }

  return next(value)
}

function toMinLengthTest (minLength: number | Ref | void): TestFn<string> {
  const minLengthValue = toValue(minLength)

  if (minLength == null) {
    return toNext
  }

  return function (value, path, context, next) {
    const minLength = minLengthValue(path, context)

    if (Buffer.byteLength(value) < minLength) {
      throw context.error(path, 'String', 'minLength', minLength, value)
    }

    return next(value)
  }
}

function toMaxLengthTest (maxLength: number | Ref | void): TestFn<string> {
  const maxLengthValue = toValue(maxLength)

  if (maxLength == null) {
    return toNext
  }

  return function (value, path, context, next) {
    const maxLength = maxLengthValue(path, context)

    if (Buffer.byteLength(value) > maxLength) {
      throw context.error(path, 'String', 'maxLength', maxLength, value)
    }

    return next(value)
  }
}

function toPatternTest (pattern: string | Ref): TestFn<string> {
  if (pattern == null) {
    return toNext
  }

  const patternValue = toValue(pattern)

  return function (value, path, context, next) {
    const re = new RegExp(patternValue(path, context))

    if (!re.test(value)) {
      throw context.error(path, 'String', 'pattern', pattern, value)
    }

    return next(value)
  }
}
