import Promise = require('any-promise')

import * as Types from './types'
import * as Formats from './formats'
import * as Parsers from './parsers'

import { compile } from './support/test'

// Export types.
export { Types, Formats, Parsers }

/**
 * Validate data against a schema.
 */
export function validate <T> (schema: Types.Any, value: T): Promise<T> {
  return compile(schema)(value)
}
