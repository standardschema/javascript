import { Rule, RuleOptions } from './rule'
import { TestFn, wrapIsType } from '../utils'

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

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return this.whitelist.indexOf(value) > -1
    })
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
