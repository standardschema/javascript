import { Any, AnyOptions } from './any'
import { ValidationError } from '../support/error'
import { allowEmpty, identity, TestFn } from '../support/test'

export interface NumberOptions extends AnyOptions {
  min?: number
  max?: number
}

export class Number extends Any {

  type = 'number'
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

    this._tests.push(allowEmpty(isNumber))
    this._tests.push(allowEmpty(toMinTest(this.min)))
    this._tests.push(allowEmpty(toMaxTest(this.max)))
  }

}

function isNumber <T> (value: T, path: string[]): T {
  if (typeof value !== 'number') {
    throw new ValidationError(path, 'type', 'number', value)
  }

  return value
}

function toMinTest (min: number): TestFn<number> {
  if (min == null) {
    return identity
  }

  return function (value: number, path: string[]) {
    if (value < min) {
      throw new ValidationError(path, 'min', min, value)
    }

    return value
  }
}

function toMaxTest (max: number): TestFn<number> {
  if (max == null) {
    return identity
  }

  return function (value: number, path: string[]) {
    if (value > max) {
      throw new ValidationError(path, 'max', max, value)
    }

    return value
  }
}
