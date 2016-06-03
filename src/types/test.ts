import Promise = require('any-promise')
import { Rule, RuleOptions } from './rule'
import { TestFn } from '../utils'

export interface TestOptions extends RuleOptions {
  name: string
  test: (value: any) => any
}

export class Test extends Rule implements TestOptions {

  type = 'Test'
  name: string
  test: (value: any) => any

  constructor (options: TestOptions) {
    super(options)

    this.name = options.name
    this.test = options.test

    this._tests.push(toTestTest(this.name, this.test))
  }

}

/**
 * Generate a unique db row check for validation.
 */
function toTestTest (name: string, test: (value: any) => any): TestFn<any> {
  return function (value, path, context, next) {
    return new Promise(resolve => resolve(test(value)))
      .then(passed => {
        if (!passed) {
          return Promise.reject(context.error(path, 'Test', 'test', name, value))
        }

        return next(value)
      })
  }
}
