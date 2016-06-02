import { TestFn } from '../utils'

export interface RuleOptions {
  description?: string
  meta?: any
}

export class Rule implements RuleOptions {

  type = 'Any'
  description: string
  meta: any = {}

  _tests: Array<TestFn<any>> = []

  constructor (options: RuleOptions = {}) {
    if (options.description != null) {
      this.description = options.description
    }

    if (options.meta != null) {
      this.meta = options.meta
    }
  }

  /**
   * Synchronous, structural type-check.
   */
  _isType (value: any) {
    return false
  }

  /**
   * Check whether a type is a sub-type of this type.
   */
  _typeOf (other: Rule) {
    return other instanceof this.constructor
  }

}
