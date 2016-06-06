import Promise = require('any-promise')
import { Rule, RuleOptions } from './rule'
import { TestFn } from '../utils'

export interface MutateOptions extends RuleOptions {
  name: string
  mutate: (value: any) => any
}

export class Mutate extends Rule implements MutateOptions {

  type = 'Test'
  name: string
  mutate: (value: any) => any

  constructor (options: MutateOptions) {
    super(options)

    this.name = options.name
    this.mutate = options.mutate

    this._tests.push(toMutateTest(this.mutate))
  }

}

/**
 * Generate a unique db row check for validation.
 */
function toMutateTest (mutate: (value: any) => any): TestFn<any> {
  return function (value, path, context, next) {
    return new Promise(resolve => resolve(mutate(value)))
      .then(mutation => {
        return next(mutation).then(() => value)
      })
  }
}
