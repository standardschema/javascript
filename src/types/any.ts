import assert = require('assert')
import { identity, TestFn, allowEmpty, ValidationContext } from '../support/test'
import { ValidationError } from '../support/error'
import { getPath, relativePath } from '../support/path'

export interface AnyOptions {
  required?: boolean
  enum?: any[]
  default?: any
  ref?: string[]
  description?: string
  meta?: any
}

export class Any {

  type = 'any'
  required = true
  enum: any[]
  default: any
  ref: string[]
  description: string
  meta: any = {}

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

    if (options.enum != null) {
      this.enum = options.enum

      assert.ok(Array.isArray(this.enum), `Expected "enum" to be an array`)
    }

    if (options.description != null) {
      this.description = options.description
    }

    if (options.meta != null) {
      this.meta = options.meta
    }

    this._tests.push(toRefTest(this.ref))
    this._tests.push(toDefaultTest(this.default))
    this._tests.push(toRequiredTest(this.required))
    this._tests.push(allowEmpty(toEnumTest(this.enum)))
  }

}

/**
 * Generate a "required" function.
 */
function toRequiredTest (required: boolean) {
  if (!required) {
    return identity
  }

  return function <T> (value: T, path: string[]): T {
    if (value == null) {
      throw new ValidationError(path, 'required', required, value)
    }

    return value
  }
}

/**
 * Generate an enum check function.
 */
function toEnumTest (enums: any[]) {
  if (enums == null) {
    return identity
  }

  return function <T> (value: T, path: string[]): T {
    if (enums.indexOf(value) === -1) {
      throw new ValidationError(path, 'enum', enums, value)
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

  return function (value: any, path: string[], context: ValidationContext) {
    return getPath(context.root, relativePath(path, ref))
  }
}
