import { Any, AnyOptions } from './any'
import { promiseEvery } from '../support/promises'
import { skipEmpty, Context, TestFn, compose } from '../utils'

export interface ObjectOptions extends AnyOptions {
  properties?: ObjectProperties
  patterns?: ObjectProperties
}

export interface ObjectProperties {
  [key: string]: Any
}

export class Object extends Any {

  type = 'object'
  properties: ObjectProperties = {}
  patterns: ObjectProperties = {}

  constructor (options: ObjectOptions) {
    super(options)

    if (options.properties != null) {
      this.properties = options.properties
    }

    if (options.patterns != null) {
      this.patterns = options.patterns
    }

    this._tests.push(skipEmpty(isObject))
    this._tests.push(skipEmpty(toPropertiesTest(this.properties, this.patterns)))
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
function toPropertiesTest (properties: ObjectProperties, patterns: ObjectProperties) {
  const patternTests = global.Object.keys(patterns)
    .map<[RegExp, TestFn<any>]>(key => {
      return [new RegExp(key), compose(patterns[key]._tests)]
    })

  const propertyTests = global.Object.keys(properties)
    .map<[string, TestFn<any>]>(key => {
      return [key, compose(properties[key]._tests)]
    })

  return function (object: any, path: string[], context: Context) {
    const keys = global.Object.keys(object)

    // TODO(blakeembrey): Validate _all_ keys when intersection is corrected.
    return promiseEvery(keys.map(function (key) {
      return function () {
        const value = object[key]

        for (const [prop, test] of propertyTests) {
          if (prop === key) {
            return test(value, path.concat(key), context)
          }
        }

        for (const [match, test] of patternTests) {
          if (match.test(key)) {
            return test(value, path.concat(key), context)
          }
        }

        // TODO: Throw an error when property does not match.
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
