import Promise = require('any-promise')

import { Any } from '../types/any'
import { MultiError } from '../support/error'

/**
 * Noop. Return the input value.
 */
export function identity <T> (value: T) {
  return value
}

/**
 * Test function.
 */
export interface TestFn <T> {
  (value: T, path?: string[], context?: ValidationContext): T
}

/**
 * Wrap a function to skip empty input values.
 */
export function allowEmpty <T> (test: TestFn<T>): TestFn<T> {
  return function (value: T, path: string[], context: ValidationContext) {
    if (value == null) {
      return value
    }

    return test(value, path, context)
  }
}

/**
 * Context to pass around during validation.
 */
export interface ValidationContext {
  root: any
  errors: Error[]
  rootSchema: Any
}

/**
 * Convert a schema to a validation function.
 */
export function compile (schema: Any) {
  const test = wrap(schema)

  return function <T> (value: T): Promise<T> {
    // Create a validation context.
    const context: ValidationContext = { root: value, rootSchema: schema, errors: [] }

    return test(value, [], context)
      .then(
        () => value,
        (err) => Promise.reject(new MultiError(context.errors))
      )
  }
}

/**
 * Wrap a schema for validation.
 */
export function wrap (schema: Any) {
  return function <T> (value: T, path: string[], context: ValidationContext): Promise<T> {
    // Run each test in order.
    function reducer <T> (result: Promise<T>, test: TestFn<T>): Promise<T> {
      return result.then(function (value: T) {
        return Promise.resolve(test(value, path, context)).catch(collectError)
      })
    }

    // Wrap validation errors in a path.
    function collectError (error: Error) {
      context.errors.push(error)

      return Promise.reject(error)
    }

    return schema._tests.reduce<Promise<T>>(reducer, Promise.resolve(value))
  }
}
