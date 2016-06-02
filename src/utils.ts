import Promise = require('any-promise')
import { Rule } from './types/rule'

const _hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * Retrieve a value by path.
 */
export function getPath (value: any, path: string[]) {
  const normalized = normalizePath(path)
  let result = value

  for (const key of normalized) {
    if (!_hasOwnProperty.call(result, key)) {
      return
    }

    result = result[key]
  }

  return result
}

/**
 * Make a path relative to another.
 */
export function relativePath (a: string[], b: string[]) {
  return normalizePath([...a, '..', ...b])
}

/**
 * Normalize a path string.
 */
export function normalizePath (path: string[]) {
  const result: string[] = []

  for (const key of path) {
    if (key.charAt(0) === '.') {
      if (key === '..') {
        result.pop()
      }

      continue
    }

    result.push(key)
  }

  return result
}

/**
 * Context to pass around during validation.
 */
export interface Context {
  root: any
  error: (path: string[], keyword: string, assertion: any, value: any) => void
  rootSchema: Rule
}

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
  (value: T, path?: string[], context?: Context): T | Promise<T>
}

/**
 * Interface for the composed function.
 */
export interface ComposeFn <T> {
  (value: T, path: string[], context: Context): Promise<T>
}

/**
 * Wrap a function to skip empty input values.
 */
export function skipEmpty <T> (test: TestFn<T>): TestFn<T> {
  return function (value: T, path: string[], context: Context) {
    if (value == null) {
      return value
    }

    return test(value, path, context)
  }
}

/**
 * Compose an array of test functions together.
 */
export function compose (tests: Array<TestFn<any>>): ComposeFn<any> {
  return function <T> (value: T, path: string[], context: Context): Promise<T> {
    // Run each test in order.
    function reducer <T> (result: Promise<T>, test: TestFn<T>): Promise<T> {
      return result.then(function (value: T) {
        return test(value, path, context)
      })
    }

    return tests.reduce<Promise<T>>(reducer, Promise.resolve(value))
  }
}
