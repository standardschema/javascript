import assert = require('assert')
import { TestFn, CompiledFn, compose, toNext, Ref, toValue } from '../utils'
import { Rule, RuleOptions } from './rule'

export interface AnyOptions extends RuleOptions {
  required?: boolean
  default?: any | Ref
  uses?: Rule[]
}

export class Any extends Rule implements AnyOptions {

  type = 'Any'
  required = true
  default: any | Ref
  uses: Rule[] = []

  constructor (options: AnyOptions = {}) {
    super(options)

    if (options.default != null) {
      this.default = options.default
    }

    if (options.required != null) {
      this.required = options.required

      assert.ok(typeof this.required === 'boolean', `Expected "required" to be a boolean`)
    }

    if (options.uses != null) {
      this.uses = options.uses
    }

    this._tests.push(toDefaultTest(this.default))
    this._tests.push(toRequiredTest(this.required))
  }

  _isType (value: any): number {
    if (value == null) {
      if (this.required === false || this.default != null) {
        return 1
      }

      return 0
    }

    return 1 // Any value assigns to `any`.
  }

  /**
   * Compile types, making sure `uses` is always executed last.
   */
  _compile (): CompiledFn<any> {
    return compose([
      super._compile(),
      compose(this.uses.map(type => type._compile()))
    ])
  }

}

/**
 * Generate a "required" function.
 */
function toRequiredTest (required: boolean): TestFn<any> {
  if (!required) {
    return function (value, path, context, next) {
      // Skip the rest of validation for empty values.
      if (value == null) {
        return value
      }

      return next(value)
    }
  }

  return function (value, path, context, next) {
    if (value == null) {
      throw context.error(path, 'Any', 'required', required, value)
    }

    return next(value)
  }
}

/**
 * Set the default value during validation.
 */
function toDefaultTest (defaulted: any): TestFn<any> {
  const defaultValue = toValue(defaulted)

  if (defaulted == null) {
    return toNext
  }

  return function (value, path, context, next) {
    return next(value == null ? defaultValue(path, context) : value)
  }
}
