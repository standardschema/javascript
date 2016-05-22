import assert = require('assert')
import { Any, AnyOptions } from './any'
import { ValidationError } from '../support/error'
import { promiseEvery } from '../support/promises'
import { allowEmpty, ValidationContext, wrap } from '../support/test'

export interface ArrayOptions extends AnyOptions {
  items: Any
}

export class Array extends Any {

  type = 'array'
  items: Any

  constructor (options: ArrayOptions) {
    super(options)

    assert.ok(typeof options.items === 'object', 'Expected "items" to be a type')

    this.items = options.items

    this._tests.push(allowEmpty(isArray))
    this._tests.push(allowEmpty(toItemTest(options.items)))
  }

}

function isArray <T> (value: T[], path: string[]): T[] {
  if (!global.Array.isArray(value)) {
    throw new ValidationError(path, 'type', 'array', value)
  }

  return value
}

function toItemTest (item: Any) {
  const test = wrap(item)

  return function <T> (value: T[], path: string[], context: ValidationContext) {
    return promiseEvery<T>(value.map((value: T, index: number) => {
      return () => test(value, path.concat(String(index)), context)
    }))
  }
}
