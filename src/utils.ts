import Promise = require('any-promise')
import { ValidationError } from './support/error'
import { Rule } from './types/rule'

const _hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * Retrieve a value by path.
 */
export function getValue (value: any, path: string[]) {
  let result = value

  for (const key of path) {
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
  return [...a.slice(0, -1), ...b]
}

/**
 * Context to pass around during validation.
 */
export interface Context {
  root: any
  error: (path: string[], type: string, keyword: string, assertion: any, value: any) => ValidationError
  rootSchema: Rule
}

/**
 * Identity.
 */
export function identity <T> (value: T): T {
  return value
}

/**
 * Proceed to `next(value)`.
 */
export function toNext <T> (value: T, path: string[], context: Context, next: (value: T) => T) {
  return next(value)
}

/**
 * Validation `next()` function.
 */
export type NextFunction <T> = (value: T) => Promise<T>

/**
 * Test function signature using `throwback`.
 */
export interface TestFn <T> {
  (value: T, path: string[], context: Context, next: NextFunction<T>): T | Promise<T>
}

/**
 * Interface for the composed function.
 */
export interface CompiledFn <T> {
  (value: T, path: string[], context: Context, next: (value: T) => T): Promise<T>
}

/**
 * Compose functions into a validation chain.
 */
export function compose (tests: Array<TestFn<any>>): CompiledFn<any> {
  return function (value, path, context, done) {
    let index = -1

    function dispatch (pos: number, value: any): Promise<any> {
      if (pos <= index) {
        throw new TypeError('`next()` called multiple times')
      }

      index = pos

      const fn = tests[pos] || done

      return new Promise(resolve => {
        return resolve(fn(value, path, context, function next (value: any) {
          return dispatch(pos + 1, value)
        }))
      })
    }

    return dispatch(0, value)
  }
}
