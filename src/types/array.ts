import assert = require('assert')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { skipEmpty, Context, compose } from '../utils'
import { promiseEvery } from '../support/promises'

export interface ArrayOptions extends AnyOptions {
  items: Rule
}

export class Array extends Any implements ArrayOptions {

  type = 'Array'
  items: Rule

  constructor (options: ArrayOptions) {
    super(options)

    assert.ok(typeof options.items === 'object', 'Expected "items" to be a type')

    this.items = options.items

    this._tests.push(skipEmpty(isArray))
    this._tests.push(skipEmpty(toItemTest(this.items)))
  }

  _isType (value: any) {
    return global.Array.isArray(value)
  }

}

function isArray <T> (value: T[], path: string[], context: Context): T[] {
  if (!global.Array.isArray(value)) {
    throw context.error(path, 'type', 'Array', value)
  }

  return value
}

function toItemTest (schema: Rule) {
  const test = compose(schema._tests)

  return function <T> (value: T[], path: string[], context: Context) {
    return promiseEvery<T>(value.map((value: T, index: number) => {
      return () => test(value, path.concat(String(index)), context)
    }))
  }
}
