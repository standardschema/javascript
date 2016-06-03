import Promise = require('any-promise')
import { Rule, RuleOptions } from './rule'
import { TestFn, compose } from '../utils'

export interface MutateOptions extends RuleOptions {
  name: string
  mutate: (value: any) => any
  uses: Rule[]
}

export class Mutate extends Rule implements MutateOptions {

  type = 'Test'
  name: string
  mutate: (value: any) => any
  uses: Rule[]

  constructor (options: MutateOptions) {
    super(options)

    this.name = options.name
    this.mutate = options.mutate
    this.uses = options.uses

    this._tests.push(toMutateTest(this.name, this.mutate, this.uses))
  }

}

/**
 * Generate a unique db row check for validation.
 */
function toMutateTest (name: string, mutate: (value: any) => any, uses: Rule[]): TestFn<any> {
  const test = compose(uses.map(type => type._compile()))

  return function (value, path, context, next) {
    return new Promise(resolve => resolve(mutate(value)))
      .then(mutation => {
        return test(mutation, path, context, next).then(() => value)
      })
  }
}
