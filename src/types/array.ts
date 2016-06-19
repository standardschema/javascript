import assert = require('assert')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { Context, TestFn, NextFunction, Ref, toValue, toNext, wrapIsType } from '../utils'
import { promiseEvery } from '../support/promises'

export interface ArrayOptions extends AnyOptions {
  items: Rule
  minItems?: number | Ref
  maxItems?: number | Ref
}

export class Array extends Any implements ArrayOptions {

  type = 'Array'
  items: Rule
  minItems: number | Ref
  maxItems: number | Ref

  constructor (options: ArrayOptions) {
    super(options)

    assert.ok(typeof options.items === 'object', 'Expected "items" to be a type')

    this.items = options.items

    if (options.minItems != null) {
      this.minItems = options.minItems
    }

    if (options.maxItems != null) {
      this.maxItems = options.maxItems
    }

    this._tests.push(isArray)
    this._tests.push(toItemTest(this.items))
    this._tests.push(toMinItemsTest(this.minItems))
    this._tests.push(toMaxItemsTest(this.maxItems))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return global.Array.isArray(value) ? 1 : 0
    })
  }

}

function isArray (value: any, path: string[], context: Context, next: NextFunction<any>) {
  if (!global.Array.isArray(value)) {
    throw context.error(path, 'Array', 'type', 'Array', value)
  }

  return next(value)
}

function toItemTest (schema: Rule): TestFn<any[]> {
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

function toMinItemsTest (minItems: number | Ref): TestFn<any[]> {
  const minItemsValue = toValue(minItems)

  if (minItems == null) {
    return toNext
  }

  return function (value, path, context, next) {
    const minItems = minItemsValue(path, context)

    if (value.length < minItems) {
      throw context.error(path, 'Array', 'minItems', minItems, value)
    }

    return next(value)
  }
}

function toMaxItemsTest (maxItems: number | Ref): TestFn<any[]> {
  const maxItemsValue = toValue(maxItems)

  if (maxItems == null) {
    return toNext
  }

  return function (value, path, context, next) {
    const maxItems = maxItemsValue(path, context)

    if (value.length > maxItems) {
      throw context.error(path, 'Array', 'minItems', maxItems, value)
    }

    return next(value)
  }
}
