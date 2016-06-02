import { Rule, RuleOptions } from './rule'
import { skipEmpty, Context } from '../utils'

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

    this._tests.push(skipEmpty(toBlacklistTest(this.blacklist)))
  }

  _isType (value: any) {
    return this.blacklist.indexOf(value) === -1
  }

}

/**
 * Check if the value matches anything in the blacklist.
 */
function toBlacklistTest (blacklist: any[]) {
  return function (value: any, path: string[], context: Context) {
    if (blacklist.indexOf(value) > -1) {
      throw context.error(path, 'blacklist', blacklist, value)
    }

    return value
  }
}
