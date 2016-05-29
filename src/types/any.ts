import assert = require('assert')
import { getPath, relativePath, identity, Context, TestFn, compose } from '../utils'

export interface AnyOptions {
  required?: boolean
  default?: any
  ref?: string[]
  description?: string
  meta?: any
  uses?: Any[]
}

export class Any {

  type = 'Any'
  required = true
  default: any
  ref: string[]
  description: string
  meta: any = {}
  uses: Any[] = []

  _tests: Array<TestFn<any>> = []

  constructor (options: AnyOptions = {}) {
    if (options.default != null) {
      this.default = options.default
    }

    if (options.ref != null) {
      this.ref = options.ref
    }

    if (options.required != null) {
      this.required = options.required

      assert.ok(typeof this.required === 'boolean', `Expected "required" to be a boolean`)
    }

    if (options.description != null) {
      this.description = options.description
    }

    if (options.meta != null) {
      this.meta = options.meta
    }

    if (options.uses != null) {
      this.uses = options.uses
    }

    this._tests.push(toRefTest(this.ref))
    this._tests.push(toDefaultTest(this.default))
    this._tests.push(toRequiredTest(this.required))
    this._tests.push(toUsesTest(this.uses))
  }

  /**
   * Structural type-check for serialisation/deserialisation.
   */
  _isType (value: any) {
    return true
  }

  /**
   * Check whether a type is a sub-type of this type.
   */
  _typeOf (other: Any) {
    return other instanceof this.constructor
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
 * Convert the ref to a value.
 */
function toRefTest (ref: string[]) {
  if (ref == null) {
    return identity
  }

  return function (value: any, path: string[], context: Context) {
    return getPath(context.root, relativePath(path, ref))
  }
}

/**
 * Execute on a list of types.
 */
function toUsesTest (uses: Any[]): TestFn<any> {
  if (uses.length === 0) {
    return identity
  }

  return compose(uses.map(type => compose(type._tests)))
}
