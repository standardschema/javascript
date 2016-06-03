import assert = require('assert')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { Context, TestFn, NextFunction } from '../utils'
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

    this._tests.push(isArray)
    this._tests.push(toItemTest(this.items))
  }

  _isType (value: any) {
    return global.Array.isArray(value)
  }

}

function isArray (value: any, path: string[], context: Context, next: NextFunction<any>) {
  if (!global.Array.isArray(value)) {
    throw context.error(path, 'Array', 'type', 'Array', value)
  }

  return next(value)
}

function toItemTest (schema: Rule): TestFn<any> {
  const test = schema._compile()

  return function (value, path, context, next) {
    return promiseEvery(value.map((value: any, index: number) => {
      const next = () => value

      return function () {
        return test(value, path.concat(String(index)), context, next)
      }
    })).then(() => next(value))
  }
}
