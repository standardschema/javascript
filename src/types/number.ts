import { Any, AnyOptions } from './any'
import { skipEmpty, identity, TestFn, Context } from '../utils'

export interface NumberOptions extends AnyOptions {
  min?: number
  max?: number
}

export class Number extends Any {

  type = 'Number'
  min: number
  max: number

  constructor (options: NumberOptions = {}) {
    super(options)

    if (options.min != null) {
      this.min = options.min
    }

    if (options.max != null) {
      this.max = options.max
    }

    this._tests.push(skipEmpty(isNumber))
    this._tests.push(skipEmpty(toMinTest(this.min)))
    this._tests.push(skipEmpty(toMaxTest(this.max)))
  }

  _isType (value: any) {
    return typeof value === 'boolean'
  }

}

function isNumber <T> (value: T, path: string[], context: Context): T {
  if (typeof value !== 'number') {
    throw context.error(path, 'type', 'number', value)
  }

  return value
}

function toMinTest (min: number): TestFn<number> {
  if (min == null) {
    return identity
  }

  return function (value: number, path: string[], context: Context) {
    if (value < min) {
      throw context.error(path, 'min', min, value)
    }

    return value
  }
}

function toMaxTest (max: number): TestFn<number> {
  if (max == null) {
    return identity
  }

  return function (value: number, path: string[], context: Context) {
    if (value > max) {
      throw context.error(path, 'max', max, value)
    }

    return value
  }
}
