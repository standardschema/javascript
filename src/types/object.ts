import Promise = require('any-promise')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { TestFn, Context, CompiledFn, identity, NextFunction, wrapIsType } from '../utils'

export interface ObjectOptions extends AnyOptions {
  properties?: ObjectProperties
  propertyTypes?: ObjectPropertyTypes
}

export interface ObjectProperties {
  [key: string]: Rule
}

export type ObjectPropertyTypes = Array<[Rule, Rule]>

export class Object extends Any implements ObjectOptions {

  type = 'Object'
  properties: ObjectProperties = {}
  propertyTypes: ObjectPropertyTypes = []

  constructor (options: ObjectOptions) {
    super(options)

    if (options.properties != null) {
      this.properties = options.properties
    }

    if (options.propertyTypes != null) {
      this.propertyTypes = options.propertyTypes
    }

    this._tests.push(isObject)
    this._tests.push(toPropertiesTest(this.properties, this.propertyTypes))
  }

  /**
   * Check if an object matches the schema structure.
   */
  _isType (object: any) {
    return wrapIsType(this, object, super._isType, (object) => {
      if (typeof object !== 'object') {
        return false
      }

      // Check type against all valid keys.
      for (const key of global.Object.keys(this.properties)) {
        if (!this.properties[key]._isType(object[key])) {
          return false
        }
      }

      // Check the rest of keys against key/value types.
      for (const key of global.Object.keys(object)) {
        for (const [keyType, valueType] of this.propertyTypes) {
          if (keyType._isType(key)) {
            if (!valueType._isType(object[key])) {
              return false
            }
          }
        }
      }

      return true
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
function toPropertiesTest (properties: ObjectProperties, propertyTypes: ObjectPropertyTypes): TestFn<any> {
  const propertyTypeTests = propertyTypes
    .map<[Rule, CompiledFn<any>, CompiledFn<any>]>(function (pair) {
      const [keyType, valueType] = pair

      return [keyType, keyType._compile(), valueType._compile()]
    })

  const propertyTests = global.Object.keys(properties)
    .map<[string, CompiledFn<any>]>(function (key) {
      return [key, properties[key]._compile()]
    })

  return function (object, path, context, next) {
    const testMap: { [key: string]: Array<(path: string[], tuple: [string, any]) => Promise<[any, any]>> } = {}

    for (const [key, test] of propertyTests) {
      pushKey(testMap, key, function (path: string[], [key, value]: [string, any]) {
        return test(value, path, context, identity).then(value => [key, value])
      })
    }

    for (const key of global.Object.keys(object)) {
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
