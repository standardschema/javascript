import makeError = require('make-error-cause')
import { formatPath } from '../utils'

/**
 * Create validation error instances.
 */
export class ValidationError extends makeError.BaseError {

  constructor (
    public path: string[],
    public type: string,
    public keyword: string,
    public assertion: any,
    public value: any
  ) {
    super(`Validation failed for "${keyword}" at "${formatPath(path)}"`)
  }

}

/**
 * Combine multiple errors into one.
 */
export class MultiError extends makeError.BaseError {

  constructor (public errors: Error[]) {
    super(errors.map(err => err.message).join('; '))
  }

}
