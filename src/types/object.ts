import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { allowEmpty, ValidationContext, wrap } from '../support/test'

export interface ObjectOptions extends AnyOptions {
  properties?: ObjectProperties
}

export interface ObjectProperties {
  [key: string]: Any
}

export class Object extends Any {

  type = 'object'
  properties: ObjectProperties = {}

  constructor (options: ObjectOptions) {
    super(options)

    if (options.properties != null) {
      this.properties = options.properties
    }

    this._tests.push(allowEmpty(isObject))
    this._tests.push(allowEmpty(toPropertiesTest(this.properties)))
  }

}

/**
 * Validate the value is an object.
 */
function isObject (value: any, path: string[], context: ValidationContext) {
  if (typeof value !== 'object') {
    throw context.error(path, 'type', 'object', value)
  }

  return value
}

/**
 * Test all properties in an object definition.
 */
function toPropertiesTest (properties: ObjectProperties) {
  const keys = global.Object.keys(properties)
  const propertyTests = zip(keys, keys.map(key => wrap(properties[key])))

  return function (object: any, path: string[], context: ValidationContext) {
    // TODO(blakeembrey): Validate _all_ keys when intersection is corrected.
    return promiseEvery(keys.map(function (key) {
      return function () {
        const test = propertyTests[key]
        const value = object[key]

        return test(value, path.concat(key), context)
      }
    })).then((values) => zip(keys, values))
  }
}

/**
 * Zip keys and values into an object. Omit `undefined` values.
 */
function zip <T> (keys: string[], values: T[]): { [key: string]: T } {
  const out: any = {}

  for (let i = 0; i < keys.length; i++) {
    if (typeof values[i] !== 'undefined') {
      out[keys[i]] = values[i]
    }
  }

  return out
}
