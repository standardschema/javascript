import { Rule, RuleOptions } from './rule'
import { skipEmpty, Context } from '../utils'

export interface WhitelistOptions extends RuleOptions {
  whitelist: any[]
}

export class Whitelist extends Rule implements WhitelistOptions {

  type = 'Whitelist'
  whitelist: any[]

  constructor (options: WhitelistOptions) {
    super(options)

    if (options.whitelist != null) {
      this.whitelist = options.whitelist
    }

    this._tests.push(skipEmpty(toWhitelistTest(this.whitelist)))
  }

  _isType (value: any) {
    return this.whitelist.indexOf(value) > -1
  }

}

/**
 * Reject any values missing from the whitelist.
 */
function toWhitelistTest (whitelist: any[]) {
  return function (value: any, path: string[], context: Context) {
    if (whitelist.indexOf(value) === -1) {
      throw context.error(path, 'whitelist', whitelist, value)
    }

    return value
  }
}
