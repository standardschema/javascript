import Promise = require('any-promise')

import { Any } from '../types/any'

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
  error: (path: string[], keyword: string, assertion: any, value: any) => void
  rootSchema: Any
}

/**
 * Wrap a schema for validation.
 */
export function wrap (schema: Any) {
  return function <T> (value: T, path: string[], context: ValidationContext): Promise<T> {
    // Run each test in order.
    function reducer <T> (result: Promise<T>, test: TestFn<T>): Promise<T> {
      return result.then(function (value: T) {
        return test(value, path, context)
      })
    }

    return schema._tests.reduce<Promise<T>>(reducer, Promise.resolve(value))
  }
}
