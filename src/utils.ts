import Promise = require('any-promise')
import { ValidationError } from './support/error'
import { Rule } from './types/rule'

const IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const _hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * Make a ref object. Easily serialisable, without any obscurity.
 */
export function ref ($ref: string[], $offset?: number) {
  return { $ref, $offset }
}

/**
 * Reference object.
 */
export interface Ref {
  $ref: string[]
  $offset?: number
}

/**
 * Create a function to return a runtime value.
 */
export function toValue (value: void | string | number | boolean | Ref): (path: string[], context: any) => any {
  if (value == null || typeof value !== 'object') {
    return () => value
  }

  if (Array.isArray((value as Ref).$ref)) {
    const ref = (value as Ref).$ref
    const offset = (value as Ref).$offset

    return function (path: string[], context: Context) {
      const fullPath = relativePath(path, ref, offset)
      const result = getValue(context.root, fullPath)

      if (result == null || typeof value !== 'object') {
        throw new TypeError(`Value reference must be a primitive value (${formatPath(fullPath)})`)
      }

      return result
    }
  }

  throw new TypeError('Value argument must be a reference or primitive value')
}

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
export function relativePath (ctx: string[], ref: string[], offset: number = 0) {
  const out: string[] = []
  const rel = ctx.length - offset

  if (rel < 0) {
    throw new TypeError(`Unable to resolve offset "${offset}" from depth "${ctx.length}"`)
  }

  for (let i = 0; i < rel; i++) {
    out.push(ctx[i])
  }

  for (let i = 0; i < ref.length; i++) {
    out.push(ref[i])
  }

  return out
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
  (value: T, path: string[], context: Context, next: NextFunction<T>): Promise<T>
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

/**
 * Compile a path array to property path string.
 */
export function formatPath (segments: string[]): string {
  let result = ''

  segments.forEach(function (segment, index) {
    if (IS_VALID_IDENTIFIER.test(segment)) {
      result += index === 0 ? segment : `.${segment}`
    } else {
      result += `['${segment.replace(/'/g, '\\\'')}']`
    }
  })

  return result
}

/**
 * Call `_isType` on parent, handling `null`.
 */
export function wrapIsType <T> (
  context: any,
  value: any,
  _test: (value: any) => number,
  test: (value: any) => number
): number {
  const result = _test.call(context, value)

  if (value == null || value === 0) {
    return result
  }

  const check = test.call(context, value)

  if (check === 0) {
    return 0
  }

  return result + check
}
