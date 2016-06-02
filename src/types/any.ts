import assert = require('assert')
import { identity, Context, TestFn, compose } from '../utils'
import { Rule, RuleOptions } from './rule'

export interface AnyOptions extends RuleOptions {
  required?: boolean
  default?: any
  uses?: Rule[]
}

export class Any extends Rule implements AnyOptions {

  type = 'Any'
  required = true
  default: any
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
    this._tests.push(toUsesTest(this.uses))
  }

  _isType (value: any) {
    return true // Any value assigns to `any`.
  }

}

/**
 * Generate a "required" function.
 */
function toRequiredTest (required: boolean) {
  if (!required) {
    return identity
  }

  return function <T> (value: T, path: string[], context: Context): T {
    if (value == null) {
      throw context.error(path, 'required', required, value)
    }

    return value
  }
}

/**
 * Populate a default value when nothing set.
 */
function toDefaultTest (defaulted: any) {
  return function (value: any) {
    return value == null ? defaulted : value
  }
}

/**
 * Execute on a list of types.
 */
function toUsesTest (uses: Rule[]): TestFn<any> {
  if (uses.length === 0) {
    return identity
  }

  return compose(uses.map(type => compose(type._tests)))
}
