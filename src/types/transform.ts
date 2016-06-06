import Promise = require('any-promise')
import { Rule, RuleOptions } from './rule'
import { TestFn } from '../utils'

export interface TransformOptions extends RuleOptions {
  name: string
  transform: (value: any) => any
}

export class Transform extends Rule implements TransformOptions {

  type = 'Test'
  name: string
  transform: (value: any) => any

  constructor (options: TransformOptions) {
    super(options)

    this.name = options.name
    this.transform = options.transform

    this._tests.push(toTransformTest(this.transform))
  }

}

/**
 * Generate a unique db row check for validation.
 */
function toTransformTest (transform: (value: any) => any): TestFn<any> {
  return function (value, path, context, next) {
    return new Promise(resolve => resolve(transform(value))).then(res => next(res))
  }
}
