import extend = require('xtend')
import { TestFn, CompiledFn, compose, Context } from '../utils'

export interface RuleOptions {
  description?: string
  meta?: any
  example?: any
}

export class Rule implements RuleOptions {

  type = 'Any'
  description: string
  meta: any = {}
  example: any

  _tests: Array<TestFn<any>> = []

  constructor (options: RuleOptions = {}) {
    if (options.description != null) {
      this.description = options.description
    }

    if (options.meta != null) {
      this.meta = options.meta
    }

    if (options.example != null) {
      this.example = options.example
    }
  }

  /**
   * Synchronous, structural type-check.
   */
  _isType (value: any, path: string[], context: Context): number {
    throw context.error(path, 'Rule', 'type', 'Rule', value)
  }

  /**
   * Check whether a type is a sub-type of this type.
   */
  _typeOf (other: Rule): boolean {
    return other instanceof this.constructor
  }

  /**
   * Compile the tests into a promise chain.
   */
  _compile (): CompiledFn<any> {
    return compose(this._tests)
  }

  /**
   * Use `_extend` to provide option merging.
   */
  _extend (options: RuleOptions): RuleOptions {
    const res = extend(this, options) as RuleOptions
    delete (res as this)._tests
    return res
  }

  /**
   * Output as a JSON object.
   */
  toJSON (): any {
    const json = extend(this)
    delete json._tests
    return json
  }

}
