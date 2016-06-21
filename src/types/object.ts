import Promise = require('any-promise')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { TestFn, Context, CompiledFn, identity, NextFunction, wrapIsType } from '../utils'

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
  _isType (object: any) {
    return wrapIsType(this, object, super._isType, (object) => {
      let res = 0

      if (typeof object !== 'object') {
        return 0
      }

      const keys = global.Object.keys(object)

      if (this.minKeys != null && keys.length < this.minKeys) {
        return 0
      }

      if (this.maxKeys != null && keys.length > this.maxKeys) {
        return 0
      }

      // Check type against all valid keys.
      for (const key of global.Object.keys(this.properties)) {
        const check = this.properties[key]._isType(object[key])

        if (check === 0) {
          return 0
        }

        res += check
      }

      // Check the rest of keys against key/value types.
      for (const key of keys) {
        for (const [keyType, valueType] of this.propertyTypes) {
          if (keyType._isType(key)) {
            const check = valueType._isType(object[key])

            if (check === 0) {
              return 0
            }

            res += check
          }
        }
      }

      return res
    })
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
      for (const [keyType, keyTest, valueTest] of propertyTypeTests) {
        if (keyType._isType(key)) {
          pushKey(testMap, key, function (path: string[], [key, value]: [string, any]) {
            return promiseEvery([
              () => keyTest(key, path, context, identity),
              () => valueTest(value, path, context, identity)
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
