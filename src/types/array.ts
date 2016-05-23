import assert = require('assert')
import { Any, AnyOptions } from './any'
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

function isArray <T> (value: T[], path: string[], context: ValidationContext): T[] {
  if (!global.Array.isArray(value)) {
    throw context.error(path, 'type', 'array', value)
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
