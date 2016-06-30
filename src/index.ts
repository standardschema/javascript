import Promise = require('any-promise')

import * as Types from './types/index'
import * as Formats from './formats/index'
import * as Parsers from './parsers/index'
import * as Utils from './utils'

import { MultiError, ValidationError } from './support/error'

// Export built-ins.
export { Types, Formats, Parsers, Utils }

/**
 * Convert a schema to a validation function.
 */
export function compile (rootSchema: Types.Rule) {
  const test = rootSchema._compile()

  return function <T> (root: T): Promise<T> {
    // Create a validation context.
    const errors: ValidationError[] = []
    const context: Utils.Context = { root, rootSchema, error }

    function error (path: string[], type: string, keyword: string, assertion: any, value: any) {
      const err = new ValidationError(path, type, keyword, assertion, value)

      // Collect errors during traversal.
      errors.push(err)

      return err
    }

    return test(root, [], context, Utils.identity)
      .catch((error) => {
        // Error on non-`ValidationError` instances.
        if (!(error instanceof ValidationError)) {
          return Promise.reject(error)
        }

        return Promise.reject(errors.length ? new MultiError(errors) : error)
      })
  }
}

/**
 * Run a type check assertion.
 */
export function assert (rootSchema: Types.Rule, root: any) {
  const context: Utils.Context = { root, rootSchema, error }

  function error (path: string[], type: string, keyword: string, assertion: any, value: any) {
    return new ValidationError(path, type, keyword, assertion, value)
  }

  return rootSchema._isType(root, [], context)
}

/**
 * Check types are assignable.
 */
export function is (rootSchema: Types.Rule, root: any) {
  try {
    return assert(rootSchema, root)
  } catch (err) {
    return 0
  }
}
