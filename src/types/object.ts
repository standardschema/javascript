import extend = require('xtend')
import Promise = require('any-promise')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { Intersection } from './intersection'
import { promiseEvery } from '../support/promises'
import { TestFn, Context, CompiledFn, identity, NextFunction, wrapIsType, isType } from '../utils'

export interface ObjectOptions extends AnyOptions {
  minKeys?: number
  maxKeys?: number
  properties?: ObjectProperties
  propertyTypes?: ObjectPropertyTypes
}

export interface ObjectProperties {
  [key: string]: Rule
}

export type ObjectPropertyTypes = Array<[Rule, Rule]>

export class Object extends Any implements ObjectOptions {

  type = 'Object'
  minKeys: number
  maxKeys: number
  properties: ObjectProperties = {}
  propertyTypes: ObjectPropertyTypes = []

  constructor (options: ObjectOptions) {
    super(options)

    if (options.minKeys != null) {
      this.minKeys = options.minKeys
    }

    if (options.maxKeys != null) {
      this.maxKeys = options.maxKeys
    }

    if (options.properties != null) {
      this.properties = options.properties
    }

    if (options.propertyTypes != null) {
      this.propertyTypes = options.propertyTypes
    }

    this._tests.push(isObject)
    this._tests.push(toPropertiesTest(this.properties, this.propertyTypes, this.minKeys, this.maxKeys))
  }

  /**
   * Check if an object matches the schema structure.
   */
  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (typeof value !== 'object') {
        throw context.error(path, 'Object', 'type', 'Object', value)
      }

      let res = 0
      const keys = global.Object.keys(value)

      if (this.minKeys != null && keys.length < this.minKeys) {
        throw context.error(path, 'Object', 'minKeys', this.minKeys, keys.length)
      }

      if (this.maxKeys != null && keys.length > this.maxKeys) {
        throw context.error(path, 'Object', 'maxKeys', this.maxKeys, keys.length)
      }

      // Check type against all valid keys.
      for (const key of global.Object.keys(this.properties)) {
        res += this.properties[key]._isType(value[key], path.concat(key), context)
      }

      // Check the rest of keys against key/value types.
      for (const key of keys) {
        const keyPath = path.concat(key)

        for (const [keyType, valueType] of this.propertyTypes) {
          if (isType(keyType, key, keyPath, context)) {
            res += valueType._isType(value[key], keyPath, context)
          }
        }
      }

      return res
    })
  }

  /**
   * Override `_extend` to concat `properties` and `propertyTypes`.
   */
  _extend (options: ObjectOptions): ObjectOptions {
    const result: ObjectOptions = super._extend(options)

    if (options.properties) {
      result.properties = extend(this.properties)

      for (const key of global.Object.keys(options.properties)) {
        result.properties[key] = Intersection.intersect(this.properties[key], options.properties[key])
      }
    }

    if (options.propertyTypes) {
      result.propertyTypes = this.propertyTypes.concat(options.propertyTypes)
    }

    return result
  }

}

/**
 * Validate the value is an object.
 */
function isObject (value: any, path: string[], context: Context, next: NextFunction<any>) {
  if (typeof value !== 'object') {
    throw context.error(path, 'Object', 'type', 'Object', value)
  }

  return next(value)
}

/**
 * Test all properties in an object definition.
 */
function toPropertiesTest (
  properties?: ObjectProperties,
  propertyTypes?: ObjectPropertyTypes,
  minKeys?: number,
  maxKeys?: number
): TestFn<any> {
  const propertyTypeTests = propertyTypes
    .map<[Rule, CompiledFn<any>, CompiledFn<any>]>(function (pair) {
      const [keyType, valueType] = pair

      return [keyType, keyType._compile(), valueType._compile()]
    })

  const propertyTests = global.Object.keys(properties)
    .map<[string, CompiledFn<any>]>(function (key) {
      return [key, properties[key]._compile()]
    })

  const minKeyCount = minKeys == null ? 0 : minKeys
  const maxKeyCount = maxKeys == null ? Infinity : maxKeys

  return function (object, path, context, next) {
    const keys = global.Object.keys(object)
    const testMap: { [key: string]: Array<(path: string[], tuple: [string, any]) => Promise<[any, any]>> } = {}

    if (keys.length < minKeyCount) {
      throw context.error(path, 'Object', 'minKeys', minKeys, keys.length)
    }

    if (keys.length > maxKeyCount) {
      throw context.error(path, 'Object', 'maxKeys', maxKeys, keys.length)
    }

    for (const [key, test] of propertyTests) {
      pushKey(testMap, key, function (path: string[], [key, value]: [string, any]) {
        return test(value, path, context, identity).then(value => [key, value])
      })
    }

    for (const key of keys) {
      const keyPath = path.concat(key)

      for (const [keyType, keyTest, valueTest] of propertyTypeTests) {
        if (isType(keyType, key, keyPath, context)) {
          pushKey(testMap, key, function (path: string[], [key, value]: [string, any]) {
            return promiseEvery([
              () => keyTest(key, keyPath, context, identity),
              () => valueTest(value, keyPath, context, identity)
            ])
          })
        }
      }
    }

    const exec = global.Object.keys(testMap).map(function (key) {
      const tests = testMap[key]
      const value = object[key]
      const testPath = path.concat(key)

      return function () {
        return tests.reduce<Promise<[string, any]>>(
          function (res, test) {
            return res.then(out => test(testPath, out))
          },
          Promise.resolve<[string, any]>([key, value])
        )
      }
    })

    return promiseEvery(exec).then(pairs).then(res => next(res))
  }
}

/**
 * Zip an array of pairs into an object.
 */
function pairs (pairs: Array<[string, any]>) {
  const result: any = {}

  for (const [key, value] of pairs) {
    if (typeof value !== 'undefined') {
      result[key] = value
    }
  }

  return result
}

/**
 * Push key onto property.
 */
function pushKey <T> (obj: { [key: string]: T[] }, key: string, value: T) {
  obj[key] = obj[key] || []
  obj[key].push(value)
  return obj
}
