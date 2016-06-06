import { Rule, RuleOptions } from './rule'
import { TestFn, Ref, toValue } from '../utils'

export type ConditionComparator = '==' | '!=' | '>=' | '<='

export interface ConditionOptions extends RuleOptions {
  left: any | Ref
  right: any | Ref
  comparator?: ConditionComparator
}

export class Condition extends Rule implements ConditionOptions {

  type = 'Condition'
  left: any | Ref
  right: any | Ref
  comparator: ConditionComparator

  constructor (options: ConditionOptions) {
    super(options)

    this.left = options.left
    this.right = options.right
    this.comparator = options.comparator || '=='

    this._tests.push(toConditionTest(this.left, this.right, this.comparator))
  }

}

/**
 * Generate a unique db row check for validation.
 */
function toConditionTest (left: any | Ref, right: any | Ref, comparator: string): TestFn<any> {
  const leftValue = toValue(left)
  const rightValue = toValue(right)

  if (comparator === '==') {
    return function (value, path, context, next) {
      if (leftValue(path, context) === rightValue(path, context)) {
        return next(value)
      }

      throw context.error(path, 'Condition', null, this, value)
    }
  }

  if (comparator === '!=') {
    return function (value, path, context, next) {
      if (leftValue(path, context) !== rightValue(path, context)) {
        return next(value)
      }

      throw context.error(path, 'Condition', null, this, value)
    }
  }

  if (comparator === '>=') {
    return function (value, path, context, next) {
      if (leftValue(path, context) >= rightValue(path, context)) {
        return next(value)
      }

      throw context.error(path, 'Condition', null, this, value)
    }
  }

  if (comparator === '<=') {
    return function (value, path, context, next) {
      if (leftValue(path, context) <= rightValue(path, context)) {
        return next(value)
      }

      throw context.error(path, 'Condition', null, this, value)
    }
  }

  throw new TypeError(`Unknown Condition comparator: ${comparator}`)
}
