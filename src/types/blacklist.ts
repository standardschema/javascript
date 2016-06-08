import { Rule, RuleOptions } from './rule'
import { TestFn, wrapIsType } from '../utils'

export interface BlacklistOptions extends RuleOptions {
  blacklist: any[]
}

export class Blacklist extends Rule implements BlacklistOptions {

  type = 'Blacklist'
  blacklist: any[]

  constructor (options: BlacklistOptions) {
    super(options)

    if (options.blacklist != null) {
      this.blacklist = options.blacklist
    }

    this._tests.push(toBlacklistTest(this.blacklist))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return this.blacklist.indexOf(value) === -1
    })
  }

}

/**
 * Check if the value matches anything in the blacklist.
 */
function toBlacklistTest (blacklist: any[]): TestFn<any> {
  return function (value, path, context, next) {
    if (blacklist.indexOf(value) > -1) {
      throw context.error(path, 'Blacklist', 'blacklist', blacklist, value)
    }

    return next(value)
  }
}
