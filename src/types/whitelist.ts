import { Rule, RuleOptions } from './rule'
import { TestFn } from '../utils'

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

    this._tests.push(toWhitelistTest(this.whitelist))
  }

  _extend (options: WhitelistOptions): WhitelistOptions {
    const res = super._extend(options) as WhitelistOptions

    if (options.whitelist) {
      res.whitelist = this.whitelist.concat(options.whitelist)
    }

    return res
  }

}

/**
 * Reject any values missing from the whitelist.
 */
function toWhitelistTest (whitelist: any[]): TestFn<any> {
  return function (value, path, context, next) {
    if (whitelist.indexOf(value) === -1) {
      throw context.error(path, 'Whitelist', 'whitelist', whitelist, value)
    }

    return next(value)
  }
}
