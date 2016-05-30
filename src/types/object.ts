import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { skipEmpty, Context, compose, ComposeFn } from '../utils'

export interface ObjectOptions extends AnyOptions {
  properties?: ObjectProperties
  propertyTypes?: ObjectPropertyTypes
}

export interface ObjectProperties {
  [key: string]: Any
}

export type ObjectPropertyTypes = Array<[Any, Any]>

export class Object extends Any {

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

    this._tests.push(skipEmpty(isObject))
    this._tests.push(skipEmpty(toPropertiesTest(this.properties, this.propertyTypes)))
  }

  /**
   * Check if an object matches the schema structure.
   */
  _isType (object: any) {
    if (typeof object !== 'object') {
      return false
    }

    const keys = global.Object.keys(object)

    for (const key of keys) {
      const value = object[key]

      if (this.properties[key]) {
        return this.properties[key]._isType(value)
      }

      for (const [keyType, valueType] of this.propertyTypes) {
        if (keyType._isType(key)) {
          return valueType._isType(key)
        }
      }
    }
  }

}

/**
 * Validate the value is an object.
 */
function isObject (value: any, path: string[], context: Context) {
  if (typeof value !== 'object') {
    throw context.error(path, 'type', 'object', value)
  }

  return value
}

/**
 * Test all properties in an object definition.
 */
function toPropertiesTest (properties: ObjectProperties, propertyTypes: ObjectPropertyTypes) {
  const propertyTypeTests = propertyTypes.map<[Any, ComposeFn<any>, ComposeFn<any>]>(function (pair) {
    const [keyType, valueType] = pair

    return [keyType, compose(keyType._tests), compose(valueType._tests)]
  })

  const propertyTests = global.Object.keys(properties).map<[string, ComposeFn<any>]>(function (key) {
    return [key, compose(properties[key]._tests)]
  })

  return function (object: any, path: string[], context: Context) {
    const keys = global.Object.keys(object)

    const properties = propertyTests.map(function ([key, test]) {
      return function () {
        return test(object[key], path.concat(key), context).then(value => [key, value])
      }
    })

    const types = propertyTypeTests.map(function ([keyType, keyTest, valueTest]) {
      return function () {
        for (const key of keys) {
          if (!keyType._isType(key)) {
            continue
          }

          return promiseEvery([
            () => keyTest(key, path.concat(key), context),
            () => valueTest(object[key], path.concat(key), context)
          ])
        }
      }
    })

    return promiseEvery(types.concat(properties)).then(pairs)
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
