import { Any, AnyOptions } from './any'
import { toNext, TestFn, Context, NextFunction, toValue, Ref } from '../utils'

export interface NumberOptions extends AnyOptions {
  min?: number | Ref
  max?: number | Ref
}

export class Number extends Any implements NumberOptions {

  type = 'Number'
  min: number | Ref
  max: number | Ref

  constructor (options: NumberOptions = {}) {
    super(options)

    if (options.min != null) {
      this.min = options.min
    }

    if (options.max != null) {
      this.max = options.max
    }

    this._tests.push(isNumber)
    this._tests.push(toMinTest(this.min))
    this._tests.push(toMaxTest(this.max))
  }

  _isType (value: any) {
    return typeof value === 'number'
  }

}

function isNumber (value: any, path: string[], context: Context, next: NextFunction<any>) {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw context.error(path, 'Number', 'type', 'Number', value)
  }

  return next(value)
}

function toMinTest (min: number | Ref): TestFn<number> {
  const minValue = toValue(min)

  if (min == null) {
    return toNext
  }

  return function (value, path, context, next) {
    const min = minValue(path, context)

    if (value < min) {
      throw context.error(path, 'Number', 'min', min, value)
    }

    return next(value)
  }
}

function toMaxTest (max: number | Ref): TestFn<number> {
  const maxValue = toValue(max)

  if (max == null) {
    return toNext
  }

  return function (value, path, context, next) {
    const max = maxValue(path, context)

    if (value > max) {
      throw context.error(path, 'Number', 'max', max, value)
    }

    return next(value)
  }
}
