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
export function is (schema: Types.Rule, value: any) {
  try {
    return assert(schema, value)
  } catch (err) {
    return 0
  }
}

/**
 * Select the best matching type from a list of schemas.
 */
export function bestSchema (schemas: Types.Rule[], value: any): Types.Rule {
  let type: Types.Rule
  let score = 0

  for (const schema of schemas) {
    const subscore = is(schema, value)

    if (subscore > score) {
      type = schema
      score = subscore
    }
  }

  if (score === 0) {
    throw new TypeError('Value does not match any schemas in set')
  }

  return type
}

/**
 * Select the best matching value from a list of schema/value tuples.
 */
export function bestValue (list: Array<[Types.Rule, any]>): any {
  let result: any
  let score = 0

  for (const [schema, value] of list) {
    const subscore = is(schema, value)

    if (subscore > score) {
      result = value
      score = subscore
    }
  }

  if (score === 0) {
    throw new TypeError('No matching values found in set')
  }

  return result
}
