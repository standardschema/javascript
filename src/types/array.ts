import extend = require('xtend')
import assert = require('assert')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { Intersection } from './intersection'
import { Context, TestFn, NextFunction, Ref, toValue, toNext, wrapIsType, identity } from '../utils'
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

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (!global.Array.isArray(value)) {
        throw context.error(path, 'Array', 'type', 'Array', value)
      }

      if (this.minItems != null && value.length < this.minItems) {
        throw context.error(path, 'Object', 'minItems', this.minItems, value.length)
      }

      if (this.maxItems != null && value.length > this.maxItems) {
        throw context.error(path, 'Object', 'maxItems', this.maxItems, value.length)
      }

      let res = 1

      for (let i = 0; i < value.length; i++) {
        res += this.items._isType(value[i], path.concat(String(i)), context)
      }

      return res
    })
  }

  _extend (options: ArrayOptions): ArrayOptions {
    return extend(super._extend(options), {
      items: Intersection.intersect(this.items, options.items)
    })
  }

  toJSON () {
    const json = super.toJSON()
    json.items = this.items.toJSON()
    return json
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
      return function () {
        return test(value, path.concat(String(index)), context, identity)
      }
    })).then(res => next(res))
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
