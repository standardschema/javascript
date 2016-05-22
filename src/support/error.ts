import makeError = require('make-error-cause')

const IS_VALID_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * Create validation error instances.
 */
export class ValidationError extends makeError.BaseError {

  constructor (public path: string[], public keyword: string, public assertion: any, public value: any) {
    super(`Validation failed for "${keyword}" at "${toPath(path)}"`)
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

/**
 * Compile a path array to property path string.
 */
function toPath (segments: string[]): string {
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
