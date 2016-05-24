import Promise = require('any-promise')

import * as Types from './types/index'
import * as Formats from './formats/index'
import * as Parsers from './parsers/index'
import * as utils from './utils'

import { MultiError, ValidationError } from './support/error'
import { wrap, ValidationContext } from './support/test'

// Export built-ins.
export { Types, Formats, Parsers, utils }

/**
 * Convert a schema to a validation function.
 */
export function compile (rootSchema: Types.Any) {
  const test = wrap(rootSchema)

  return function <T> (root: T): Promise<T> {
    // Create a validation context.
    const errors: Error[] = []
    const context: ValidationContext = { root, rootSchema, error }

    function error (path: string[], keyword: string, assertion: any, value: any) {
      const err = new ValidationError(path, keyword, assertion, value)

      // Collect errors during traversal.
      errors.push(err)

      return err
    }

    return test(root, [], context)
      .then(() => root)
      .catch((error) => {
        return Promise.reject(errors.length ? new MultiError(errors) : error)
      })
  }
}
